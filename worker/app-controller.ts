import { DurableObject } from 'cloudflare:workers';
import type { SessionInfo, MeetingRecord, Summary } from './types';
import type { Env } from './core-utils';
export class AppController extends DurableObject<Env> {
  private sessions = new Map<string, SessionInfo>();
  private meetings = new Map<string, MeetingRecord>();
  private loaded = false;
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
  }
  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      const data = await this.ctx.storage.get<Map<string, unknown>>(['sessions', 'meetings']);
      this.sessions = new Map(Object.entries(data.get('sessions') || {}));
      this.meetings = new Map(Object.entries(data.get('meetings') || {}));
      this.loaded = true;
    }
  }
  private async persistSessions(): Promise<void> {
    await this.ctx.storage.put('sessions', Object.fromEntries(this.sessions));
  }
  private async persistMeetings(): Promise<void> {
    await this.ctx.storage.put('meetings', Object.fromEntries(this.meetings));
  }
  // Meeting Management
  async addMeeting(data: { transcript: string; summary: Summary }): Promise<MeetingRecord> {
    await this.ensureLoaded();
    const newMeeting: MeetingRecord = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      transcript: data.transcript,
      summary: data.summary,
    };
    this.meetings.set(newMeeting.id, newMeeting);
    await this.persistMeetings();
    return newMeeting;
  }
  async listMeetings(): Promise<MeetingRecord[]> {
    await this.ensureLoaded();
    return Array.from(this.meetings.values()).sort((a, b) => b.createdAt - a.createdAt);
  }
  // Session Management
  async addSession(sessionId: string, title?: string): Promise<void> {
    await this.ensureLoaded();
    const now = Date.now();
    this.sessions.set(sessionId, {
      id: sessionId,
      title: title || `Chat ${new Date(now).toLocaleDateString()}`,
      createdAt: now,
      lastActive: now
    });
    await this.persistSessions();
  }
  async removeSession(sessionId: string): Promise<boolean> {
    await this.ensureLoaded();
    const deleted = this.sessions.delete(sessionId);
    if (deleted) await this.persistSessions();
    return deleted;
  }
  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.ensureLoaded();
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActive = Date.now();
      await this.persistSessions();
    }
  }
  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    await this.ensureLoaded();
    const session = this.sessions.get(sessionId);
    if (session) {
      session.title = title;
      await this.persistSessions();
      return true;
    }
    return false;
  }
  async listSessions(): Promise<SessionInfo[]> {
    await this.ensureLoaded();
    return Array.from(this.sessions.values()).sort((a, b) => b.lastActive - a.lastActive);
  }
  async clearAllSessions(): Promise<number> {
    await this.ensureLoaded();
    const count = this.sessions.size;
    this.sessions.clear();
    await this.persistSessions();
    return count;
  }
}