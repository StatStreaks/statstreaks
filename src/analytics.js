export function trackEvent(name, params = {}) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}

export const GA = {
  dailyStarted: (theme) => trackEvent('daily_started', { theme }),
  dailyCompleted: (score, theme, yellowUsed, streak) => trackEvent('daily_completed', { score, theme, yellow_card_used: yellowUsed, streak }),
  dailyFailed: (score, theme, cause) => trackEvent('daily_failed', { score, theme, cause }),
  yellowCardShown: (questionIndex, theme) => trackEvent('yellow_card_shown', { question_index: questionIndex, theme }),
  yellowCardWatched: (theme) => trackEvent('yellow_card_ad_watched', { theme }),
  yellowCardDeclined: (theme) => trackEvent('yellow_card_declined', { theme }),
  scoreShared: (score, mode, theme) => trackEvent('score_shared', { score, mode, theme }),
  streakMilestone: (streak) => trackEvent('streak_milestone', { streak }),
  rushStarted: (category) => trackEvent('rush_started', { category }),
  rushCompleted: (score, cleanScore, category) => trackEvent('rush_completed', { score, clean_score: cleanScore, category }),
  rushAdWatched: (category) => trackEvent('rush_ad_watched', { category }),
};