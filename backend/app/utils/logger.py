import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict

class StructuredFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "module": record.name,
            "message": record.getMessage()
        }
        if hasattr(record, "stage"):
            log_obj["stage"] = getattr(record, "stage")
        if hasattr(record, "report_id"):
            log_obj["report_id"] = getattr(record, "report_id")
        if hasattr(record, "user_id"):
            log_obj["user_id"] = getattr(record, "user_id")
        if hasattr(record, "extra_data"):
            # Sanitize extra data: strip tokens or secrets
            extra = getattr(record, "extra_data")
            if isinstance(extra, dict):
                sanitized = {k: v for k, v in extra.items() if not any(s in k.lower() for s in ["password", "token", "secret", "key", "authorization"])}
                log_obj["metadata"] = sanitized

        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

def setup_logger():
    logger = logging.getLogger("healthform")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    # Console handler with clean colored output or json
    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter("[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    return logger

logger = setup_logger()
