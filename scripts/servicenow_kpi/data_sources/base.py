"""Abstract ticket data source — swap CSV for ServiceNow API later."""

from __future__ import annotations

from abc import ABC, abstractmethod

import pandas as pd


class TicketDataSource(ABC):
    """Load normalized ticket DataFrame from any backend."""

    @abstractmethod
    def load(self) -> pd.DataFrame:
        """
        Return a DataFrame with normalized columns:
        requester, category, reported_at, title, description, priority,
        assignee, status, comment, source, created, supervisor
        and derived: created_dt (datetime), status_norm, priority_short, is_completed, is_new
        """

    def validate(self, df: pd.DataFrame) -> None:
        if df.empty:
            raise ValueError("No tickets loaded from data source.")
        if "created_dt" not in df.columns:
            raise ValueError("Missing parsed created_dt column.")
