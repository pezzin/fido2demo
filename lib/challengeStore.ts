// Gestione centralizzata delle challenge per WebAuthn
// In produzione, usa Redis o un database per la persistenza

class ChallengeStore {
  private challenges = new Map<string, { challenge: string; timestamp: number }>();
  private readonly CHALLENGE_TIMEOUT = 5 * 60 * 1000; // 5 minuti

  store(key: string, challenge: string): void {
    this.challenges.set(key, {
      challenge,
      timestamp: Date.now()
    });
  }

  get(key: string): string | undefined {
    const entry = this.challenges.get(key);
    if (!entry) return undefined;

    // Verifica se la challenge è scaduta
    if (Date.now() - entry.timestamp > this.CHALLENGE_TIMEOUT) {
      this.challenges.delete(key);
      return undefined;
    }

    return entry.challenge;
  }

  remove(key: string): void {
    this.challenges.delete(key);
  }

  // Pulisce le challenge scadute
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.challenges.entries()) {
      if (now - entry.timestamp > this.CHALLENGE_TIMEOUT) {
        this.challenges.delete(key);
      }
    }
  }
}

// Singleton instance
const challengeStore = new ChallengeStore();

// Pulisci le challenge scadute ogni 5 minuti
if (typeof global !== 'undefined') {
  setInterval(() => {
    challengeStore.cleanup();
  }, 5 * 60 * 1000);
}

export default challengeStore;
