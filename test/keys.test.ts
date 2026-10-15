import { describe, expect, it } from 'vitest';
import { apiKeyPk, campaignSk, hashApiKey, tenantPk } from '../src/lib/keys';

describe('keys', () => {
  it('scopes partition keys by tenant', () => {
    expect(tenantPk('acme')).toBe('TENANT#acme');
    expect(tenantPk('acme')).not.toBe(tenantPk('globex'));
  });

  it('builds campaign sort keys', () => {
    expect(campaignSk('123-abc')).toBe('CAMPAIGN#123-abc');
  });

  it('hashes api keys deterministically without exposing them', () => {
    const hash = hashApiKey('top-secret');
    expect(hash).toHaveLength(64);
    expect(hash).not.toContain('top-secret');
    expect(hashApiKey('top-secret')).toBe(hash);
    expect(apiKeyPk(hash)).toBe(`APIKEY#${hash}`);
  });
});
