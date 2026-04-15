export const MINDFULNESS_QUOTES = [
  "Breathing is the bridge which connects life to consciousness, which unites your body to your thoughts.",
  "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.",
  "The little things? The little moments? They aren't little.",
  "Mindfulness isn't difficult, we just need to remember to do it.",
  "Wherever you are, be there totally.",
  "The best way to capture moments is to pay attention. This is how we cultivate mindfulness.",
  "Mindfulness means being awake. It means knowing what you are doing.",
  "The soul always knows what to do to heal itself. The challenge is to silence the mind.",
  "Quiet the mind, and the soul will speak.",
  "In today's rush, we all think too much, seek too much, want too much and forget about the joy of just being.",
  "Smile, breathe and go slowly.",
  "Life is a dance. Mindfulness is witnessing that dance.",
  "The present moment is the only time over which we have dominion.",
  "Don't believe everything you think. Thoughts are just that – thoughts.",
  "Respond; don't react. Listen; don't talk. Think; don't assume.",
  "Everything is created twice, first in the mind and then in reality.",
  "Your goal is not to get rid of your thoughts, but to learn how to be with them.",
  "The feeling that any task is a nuisance will soon disappear if it is done in mindfulness.",
  "Wisdom comes with the ability to be still. Just look and just listen. No more is needed.",
  "Be happy in the moment, that's enough. Each moment is all we need, not more."
];

export function getRandomQuote(): string {
  return MINDFULNESS_QUOTES[Math.floor(Math.random() * MINDFULNESS_QUOTES.length)];
}
