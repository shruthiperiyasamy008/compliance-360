import threading
import time
import logging
from .database import SessionLocal
from .alert_engine import AlertMonitoringService

logger = logging.getLogger(__name__)

class BackgroundMonitoringThread:
    """
    Lightweight, thread-safe in-process scheduled background monitor.
    Continuously executes alert checks, deadline monitoring, and escalation triggers
    at fixed intervals without needing external Redis/Celery configuration for zero-setup demo.
    """
    def __init__(self, interval_seconds: int = 60):
        self.interval = interval_seconds
        self.is_running = False
        self.thread = None

    def start(self):
        if self.is_running:
            return
        self.is_running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
        print(f"[Alert Engine] Scheduled background monitoring worker active (cycle: {self.interval}s)")

    def stop(self):
        self.is_running = False

    def _run_loop(self):
        while self.is_running:
            try:
                with SessionLocal() as db:
                    engine = AlertMonitoringService(db)
                    summary = engine.run_all_monitors()
            except Exception as e:
                print(f"[Alert Engine Error] Background monitor cycle failed: {e}")
            time.sleep(self.interval)

monitor_worker = BackgroundMonitoringThread(interval_seconds=60)

