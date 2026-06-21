import logging


def configure_logging() -> None:
    """Configure structured-enough logs for hosted platforms."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
