"""portal catalog tables

Revision ID: 004
Revises: 003
Create Date: 2026-06-15

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "portal_incident_items",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("icon", sa.String(length=64), nullable=False),
        sa.Column("ticket_category", sa.String(length=64), nullable=False),
        sa.Column("portal_flow", sa.String(length=64), nullable=True),
        sa.Column("prefill_problem_area", sa.String(length=128), nullable=True),
        sa.Column("form_type", sa.String(length=64), nullable=False, server_default="dynamic_incident"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "portal_incident_groups",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("item_ids", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "service_catalog_items",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("icon", sa.String(length=64), nullable=False),
        sa.Column("request_type", sa.String(length=64), nullable=False),
        sa.Column("ticket_category", sa.String(length=64), nullable=False),
        sa.Column("form_type", sa.String(length=64), nullable=True),
        sa.Column("id_prefix", sa.String(length=8), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("service_catalog_items")
    op.drop_table("portal_incident_groups")
    op.drop_table("portal_incident_items")
