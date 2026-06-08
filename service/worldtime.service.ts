// services/worldtime.service.ts
import axios from 'axios';

interface WorldTimeResponse {
  datetime: string;
  unixtime: number;
  timezone: string;
  dst: boolean;
  dst_offset: number;
  utc_offset: string;
}

export class WorldTimeService {
  private cache: Map<string, { data: WorldTimeResponse; expiresAt: number }> = new Map();
  private cacheTTL = 60_000; // 1 minute

  async getTimeForTimezone(timezone: string): Promise<WorldTimeResponse> {
    const cached = this.cache.get(timezone);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const url = `https://time.now/developer/api/timezone/${timezone}`;
    const response = await axios.get<WorldTimeResponse>(url);
    const data = response.data;
    this.cache.set(timezone, { data, expiresAt: Date.now() + this.cacheTTL });
    return data;
  }

  async getCurrentTimeForTimezone(timezone: string): Promise<Date> {
    const res = await this.getTimeForTimezone(timezone);
    return new Date(res.datetime);
  }
}