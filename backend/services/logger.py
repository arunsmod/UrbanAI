"""
URBANAi Logging Module

Provides structured logging for the application with optional JSON output.
"""

import logging
import json
import sys
from datetime import datetime
from typing import Optional

try:
    from pythonjsonlogger import jsonlogger
    HAS_JSON_LOGGER = True
except ImportError:
    HAS_JSON_LOGGER = False


class CustomJsonFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        if hasattr(record, 'extra_data'):
            log_data.update(record.extra_data)
        
        return json.dumps(log_data)


def setup_logger(
    name: str = "urbanai",
    level: int = logging.INFO,
    json_format: bool = False
) -> logging.Logger:
    """
    Configure and return a logger for the application.
    
    Args:
        name: Logger name
        level: Logging level (logging.INFO, DEBUG, etc.)
        json_format: Whether to use JSON output format
    
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Clear existing handlers to avoid duplicates
    logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    
    if json_format and HAS_JSON_LOGGER:
        formatter = CustomJsonFormatter()
    else:
        # Standard text format
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Prevent propagation to root logger
    logger.propagate = False
    
    return logger


def get_logger(name: str = "urbanai") -> logging.Logger:
    """Get or create a logger instance."""
    return logging.getLogger(name)


# Create default logger
logger = setup_logger()
