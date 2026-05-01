# -*- coding: utf-8 -*-
"""Rate limiter singleton — shared across all routers."""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
