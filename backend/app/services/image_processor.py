"""
ImageProcessor — HealthForm AI
===============================
Industrial-grade computer vision preprocessing and document quality assessment
for medical laboratory documents and photo uploads.

Handles:
  - Blur detection and unsharp mask sharpening
  - Severe blue/yellow tint correction (Gray-World color balancing)
  - Non-uniform shadow and lighting removal (LAB CLAHE & background normalization)
  - Document deskewing and orientation correction
  - Document quality scoring (0.0 to 1.0) with granular signals
  - Multi-page PDF page rendering via PyMuPDF
"""

import io
import math
import logging
from typing import Dict, Any, Tuple, Optional, List
import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger("healthform.image_processor")

class QualityRating:
    GOOD = "GOOD"
    ACCEPTABLE = "ACCEPTABLE"
    POOR = "POOR"
    UNREADABLE = "UNREADABLE"


class ImageProcessor:
    """
    State-of-the-art document image enhancement and quality assessment engine.
    Never alters the original file; produces enhanced and high-contrast derivatives.
    """

    @staticmethod
    def load_image_cv2(image_input) -> Optional[np.ndarray]:
        """Loads image into BGR numpy array from bytes, file path, or PIL Image."""
        try:
            if isinstance(image_input, bytes):
                nparr = np.frombuffer(image_input, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                return img
            elif isinstance(image_input, str):
                img = cv2.imread(image_input, cv2.IMREAD_COLOR)
                return img
            elif isinstance(image_input, Image.Image):
                rgb = np.array(image_input.convert("RGB"))
                return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
            elif isinstance(image_input, np.ndarray):
                return image_input
        except Exception as e:
            logger.error(f"Failed to load image into cv2: {e}")
        return None

    @classmethod
    def assess_quality(cls, img: np.ndarray) -> Dict[str, Any]:
        """
        Assesses image quality across multiple visual and document dimensions:
          1. Resolution & Pixel count
          2. Blur / Focus (Laplacian variance)
          3. Contrast (Intensity standard deviation & dynamic range)
          4. Brightness (Mean luminance & clipping)
          5. Aspect ratio and document layout plausibility
        Returns quality score (0.0 to 1.0) and Rating (GOOD, ACCEPTABLE, POOR, UNREADABLE).
        """
        if img is None or img.size == 0:
            return {
                "score": 0.0,
                "rating": QualityRating.UNREADABLE,
                "blur_score": 0.0,
                "contrast_score": 0.0,
                "brightness_score": 0.0,
                "resolution_score": 0.0,
                "is_usable": False,
                "feedback": "Image is empty or unreadable."
            }

        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 1. Resolution score (target: at least 1000px on smallest side, min 600px)
        min_dim = min(h, w)
        if min_dim >= 1200:
            res_score = 1.0
        elif min_dim >= 800:
            res_score = 0.8
        elif min_dim >= 500:
            res_score = 0.6
        elif min_dim >= 300:
            res_score = 0.35
        else:
            res_score = 0.1

        # 2. Blur / sharpness (Variance of Laplacian)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        # Typical document: sharp > 200, acceptable 80-200, blurry < 80, very blurry < 30
        if laplacian_var >= 250:
            blur_score = 1.0
        elif laplacian_var >= 120:
            blur_score = 0.85
        elif laplacian_var >= 60:
            blur_score = 0.65
        elif laplacian_var >= 25:
            blur_score = 0.40
        else:
            blur_score = 0.15

        # 3. Contrast score (Standard deviation of luminance)
        std_dev = float(np.std(gray))
        if std_dev >= 55:
            contrast_score = 1.0
        elif std_dev >= 40:
            contrast_score = 0.85
        elif std_dev >= 25:
            contrast_score = 0.60
        elif std_dev >= 15:
            contrast_score = 0.35
        else:
            contrast_score = 0.15

        # 4. Brightness score (Penalize severe underexposure < 40 or overexposure > 225)
        mean_brightness = float(np.mean(gray))
        if 80 <= mean_brightness <= 200:
            bright_score = 1.0
        elif 50 <= mean_brightness <= 220:
            bright_score = 0.75
        elif 30 <= mean_brightness <= 240:
            bright_score = 0.45
        else:
            bright_score = 0.20

        # Weighted aggregate score
        total_score = (
            0.30 * blur_score +
            0.25 * contrast_score +
            0.25 * res_score +
            0.20 * bright_score
        )
        # Low-contrast noise penalty (severely underexposed or unresolvable sensor noise)
        if std_dev < 10.0 or (min_dim < 250 and std_dev < 18.0) or (mean_brightness < 35.0 and std_dev < 16.0):
            total_score = min(total_score, 0.18)

        total_score = round(float(np.clip(total_score, 0.0, 1.0)), 3)

        # Rating categorization
        # IMPORTANT: "POOR does NOT automatically mean INVALID"
        if total_score >= 0.72:
            rating = QualityRating.GOOD
            is_usable = True
            feedback = "Report image is clear and sharp."
        elif total_score >= 0.48:
            rating = QualityRating.ACCEPTABLE
            is_usable = True
            feedback = "Report image is acceptable for extraction."
        elif total_score >= 0.22:
            rating = QualityRating.POOR
            is_usable = True  # Can still attempt extraction!
            feedback = "Report image has lower quality (lighting/blur); processing with enhanced recovery."
        else:
            rating = QualityRating.UNREADABLE
            is_usable = False
            feedback = "Document is severely blurred, dark, or low resolution. Please upload a clearer photo."

        return {
            "score": total_score,
            "rating": rating,
            "blur_metric": round(float(laplacian_var), 1),
            "blur_score": round(blur_score, 2),
            "contrast_metric": round(std_dev, 1),
            "contrast_score": round(contrast_score, 2),
            "brightness_metric": round(mean_brightness, 1),
            "brightness_score": round(bright_score, 2),
            "resolution": f"{w}x{h}",
            "resolution_score": round(res_score, 2),
            "is_usable": is_usable,
            "feedback": feedback
        }

    @classmethod
    def correct_color_tint(cls, img: np.ndarray) -> np.ndarray:
        """
        Removes blue, cyan, yellow, or reddish color casts common in smartphone photos
        under fluorescent or LED lighting using Gray-World white balancing.
        """
        try:
            b, g, r = cv2.split(img.astype(np.float32))
            mean_b = np.mean(b) + 1e-5
            mean_g = np.mean(g) + 1e-5
            mean_r = np.mean(r) + 1e-5

            # Gray world assumption: average of all channels should match overall mean
            k = (mean_b + mean_g + mean_r) / 3.0
            b = np.clip(b * (k / mean_b), 0, 255)
            g = np.clip(g * (k / mean_g), 0, 255)
            r = np.clip(r * (k / mean_r), 0, 255)

            balanced = cv2.merge([b, g, r]).astype(np.uint8)
            return balanced
        except Exception as e:
            logger.warning(f"Color tint correction failed: {e}")
            return img

    @classmethod
    def remove_shadows_and_enhance(cls, img: np.ndarray) -> np.ndarray:
        """
        Removes uneven lighting, shadows, and enhances text contrast
        using LAB color space with Contrast Limited Adaptive Histogram Equalization (CLAHE).
        """
        try:
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)

            # Apply CLAHE to L channel to balance non-uniform illumination and shadows
            clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
            cl = clahe.apply(l)

            enhanced_lab = cv2.merge((cl, a, b))
            enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)
            return enhanced
        except Exception as e:
            logger.warning(f"Shadow removal failed: {e}")
            return img

    @classmethod
    def sharpen_image(cls, img: np.ndarray) -> np.ndarray:
        """
        Sharpens text characters using unsharp masking.
        Recovers slightly blurry document edges without amplifying noise.
        """
        try:
            # Gaussian blur base
            gaussian = cv2.GaussianBlur(img, (0, 0), sigmaX=2.0)
            # Unsharp mask: original + 1.2 * (original - gaussian)
            sharpened = cv2.addWeighted(img, 1.6, gaussian, -0.6, 0)
            return sharpened
        except Exception as e:
            logger.warning(f"Sharpening failed: {e}")
            return img

    @classmethod
    def deskew_image(cls, img: np.ndarray) -> Tuple[np.ndarray, float]:
        """
        Detects document skew angle and rotates to horizontal alignment.
        Limits correction to [-30, 30] degrees to avoid unintended 90-degree rotations.
        """
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            # Invert and blur
            blur = cv2.GaussianBlur(gray, (7, 7), 0)
            thresh = cv2.adaptiveThreshold(
                blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 5
            )

            # Find text coordinates
            coords = np.column_stack(np.where(thresh > 0))
            if len(coords) < 100:
                return img, 0.0

            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            elif angle > 45:
                angle = 90 - angle

            # Only correct realistic skew angles between -30 and +30 degrees
            if abs(angle) > 0.5 and abs(angle) <= 30.0:
                h, w = img.shape[:2]
                center = (w // 2, h // 2)
                M = cv2.getRotationMatrix2D(center, angle, 1.0)
                rotated = cv2.warpAffine(
                    img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
                )
                return rotated, angle
            return img, 0.0
        except Exception as e:
            logger.warning(f"Deskew failed: {e}")
            return img, 0.0

    @classmethod
    def produce_binary_document(cls, img: np.ndarray) -> np.ndarray:
        """
        Generates a clean, high-contrast binarized document optimized for OCR engines.
        """
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            # Bilateral filter preserves sharp edges while smoothing paper grain
            denoised = cv2.bilateralFilter(gray, 9, 75, 75)
            # Adaptive thresholding handles gradient shadows across the page
            binary = cv2.adaptiveThreshold(
                denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 10
            )
            return binary
        except Exception as e:
            logger.warning(f"Binarization failed: {e}")
            return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    @classmethod
    def normalize_resolution(cls, img: np.ndarray, max_dim: int = 2048) -> np.ndarray:
        """
        Scales down extremely high-resolution images (>2048px) to reduce latency and token size
        while maintaining full text legibility.
        """
        h, w = img.shape[:2]
        if max(h, w) > max_dim:
            scale = max_dim / float(max(h, w))
            new_w, new_h = int(w * scale), int(h * scale)
            img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
        return img

    @classmethod
    def process_image(cls, image_bytes: bytes) -> Dict[str, Any]:
        """
        Full comprehensive pipeline for image uploads:
          1. Load original
          2. Assess initial quality
          3. Normalize resolution
          4. Correct color tint (blue/yellow cast)
          5. Remove shadows and balance contrast (CLAHE)
          6. Sharpen slightly blurry text
          7. Deskew orientation
          8. Generate high-contrast binary version for OCR
        Returns original and enhanced representations along with quality metadata.
        """
        original_cv = cls.load_image_cv2(image_bytes)
        if original_cv is None:
            return {
                "success": False,
                "error": "Failed to decode image data.",
                "quality": cls.assess_quality(None)
            }

        # Assess initial quality
        quality_info = cls.assess_quality(original_cv)

        # Preprocessing sequence
        working_img = cls.normalize_resolution(original_cv)
        working_img = cls.correct_color_tint(working_img)
        working_img = cls.remove_shadows_and_enhance(working_img)
        working_img = cls.sharpen_image(working_img)
        deskewed_img, skew_angle = cls.deskew_image(working_img)
        binary_img = cls.produce_binary_document(deskewed_img)

        # Encode enhanced outputs back to bytes
        _, enhanced_jpg = cv2.imencode(".jpg", deskewed_img, [cv2.IMWRITE_JPEG_QUALITY, 92])
        _, binary_png = cv2.imencode(".png", binary_img)

        quality_info["skew_angle_corrected"] = round(float(skew_angle), 2)

        return {
            "success": True,
            "original_bytes": image_bytes,
            "enhanced_bytes": enhanced_jpg.tobytes(),
            "binary_bytes": binary_png.tobytes(),
            "enhanced_cv": deskewed_img,
            "binary_cv": binary_img,
            "quality": quality_info
        }

    @classmethod
    def render_pdf_to_images(cls, pdf_path: str, dpi: int = 150) -> List[Dict[str, Any]]:
        """
        Renders multi-page PDF documents to high-resolution images for vision processing.
        Supports multi-page lab reports.
        """
        import pymupdf  # Modern PyMuPDF API
        rendered_pages = []
        try:
            doc = pymupdf.open(pdf_path)
            zoom = dpi / 72.0
            mat = pymupdf.Matrix(zoom, zoom)

            for page_idx in range(len(doc)):
                page = doc[page_idx]
                pix = page.get_pixmap(matrix=mat, alpha=False)
                png_bytes = pix.tobytes("png")
                
                # Assess quality of rendered page
                nparr = np.frombuffer(png_bytes, np.uint8)
                page_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                quality = cls.assess_quality(page_cv)

                rendered_pages.append({
                    "page_number": page_idx + 1,
                    "image_bytes": png_bytes,
                    "width": pix.width,
                    "height": pix.height,
                    "quality": quality,
                    "has_native_text": len(page.get_text().strip()) > 30
                })
            doc.close()
        except Exception as e:
            logger.error(f"Failed to render PDF to images: {e}")
        return rendered_pages
