import contextlib
import os
import sys
import types
from pathlib import Path


def prepare_ultralytics_runtime() -> None:
    """Configure Ultralytics for headless inference without optional plotting DLLs."""
    config_dir = Path(".ultralytics").resolve()
    config_dir.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("YOLO_CONFIG_DIR", str(config_dir))
    os.environ.setdefault("MPLBACKEND", "Agg")

    if "matplotlib.pyplot" in sys.modules:
        return

    pyplot = types.ModuleType("matplotlib.pyplot")
    pyplot.get_backend = lambda: "Agg"
    pyplot.close = lambda *args, **kwargs: None
    pyplot.switch_backend = lambda *args, **kwargs: None
    pyplot.rc_context = lambda *args, **kwargs: contextlib.nullcontext()

    matplotlib = types.ModuleType("matplotlib")
    matplotlib.__path__ = []
    matplotlib.pyplot = pyplot
    sys.modules["matplotlib"] = matplotlib
    sys.modules["matplotlib.pyplot"] = pyplot
