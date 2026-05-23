import logging
import sys

def configure_logging(environment: str) -> None:
    """
    Configure root logger once on app startup.
    Development uses verbose human-readable output, production uses a leaner
    single-line format suitable for log aggregators.
    """
    if environment == "development":
        level = logging.DEBUG
        log_format = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    else:
        level = logging.INFO
        log_format = "%(asctime)s %(levelname)s %(name)s %(message)s"
    
    # Reset handlers in case basicConfig has already been called (uvicorn does this)
    root = logging.getLogger()
    for handler in list(root.handlers):
        root.removeHandler(handler)
    
    logging.basicConfig(
        level=level,
        format=log_format,
        datefmt="%Y-%m-%d %H:%M:%S",
        stream=sys.stdout,
    )
    
    # Quiet down noisy third-party loggers in production
    if environment != "development":
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
