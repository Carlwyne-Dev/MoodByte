export const PET_TYPES = [
  { id: '1 Dog', label: 'Dog 1' },
  { id: '2 Dog 2', label: 'Dog 2' },
  { id: '3 Cat', label: 'Cat 1' },
  { id: '4 Cat 2', label: 'Cat 2' },
  { id: '5 Rat', label: 'Rat 1' },
  { id: '6 Rat 2', label: 'Rat 2' },
  { id: '7 Bird', label: 'Bird 1' },
  { id: '8 Bird 2', label: 'Bird 2' },
];

export const DIALOGUE = {
  focusing: [
    "Keep going! You're doing great.",
    "Deep breaths. We got this.",
    "Don't look at your phone. I'm watching you.",
    "You're in the zone! Don't stop now.",
    "Just a little bit more. Stay focused!",
    "I believe in you! Keep pushing.",
    "This is where the magic happens."
  ],
  break: [
    "Phew! Time for a well-deserved stretch!",
    "Pomodoro complete! Go grab some water.",
    "We survived! Let your eyes rest.",
    "Great session! Shake those hands out.",
    "Time's up! Take a real break, no cheating.",
    "I'm exhausted just watching you. Break time!",
    "Mission accomplished. Hydrate!"
  ],
  idle: [
    "Are you still there? The page is getting cold...",
    "Daydreaming again? Let's get back to it!",
    "Zzz... Oh! You're back! Let's focus.",
    "Hello? Did you fall down a rabbit hole?",
    "I'm getting lonely wandering down here...",
    "You were doing so well! Come back to the desk!",
    "I'm waiting for you to make a move..."
  ],
  general: [
    "Wow, that's a lot of words. You're on fire.",
    "I like this music. Good choice.",
    "Are you really going to read all of that?",
    "I'm just a handful of pixels, but I'm proud of you.",
    "If I had hands, I'd give you a high five.",
    "Don't forget to blink!"
  ],
  facts: {
    Cat: [
      "Did you know? Cats sleep for 12 to 16 hours a day. I wish I could.",
      "Fun fact: Cats can rotate their ears 180 degrees... mostly to ignore you.",
      "Did you know? A digital cat's purr can lower your stress. *purrs digitally*",
      "Fun fact: Cats have five toes on their front paws, but only four on the back.",
      "Did you know? Adult cats only meow at humans, never at other cats!"
    ],
    Dog: [
      "Fun fact: Dogs have three eyelids! That's why I never need to blink.",
      "Did you know? A dog's sense of smell is 10,000 times stronger than yours.",
      "Fun fact: Dogs can understand up to 250 words and gestures.",
      "Did you know? Just petting a dog can lower your blood pressure. Pretend to pet me!",
      "Fun fact: Greyhounds can beat cheetahs in a long-distance race."
    ],
    Rat: [
      "Did you know? Rats are highly ticklish and even 'laugh' when tickled.",
      "Fun fact: Rats have excellent memories and learn complex mazes. Your desk is easy.",
      "Did you know? Rats grind their teeth when they're happy, it's called 'bruxing'.",
      "Fun fact: Despite the stereotypes, rats are incredibly clean and groom constantly.",
      "Did you know? A rat can tread water for up to three days. Not that I want to try."
    ],
    Bird: [
      "Fun fact: Birds don't have teeth! That's why I don't need a dentist.",
      "Did you know? Some birds can sleep with one eye open.",
      "Fun fact: Crows can recognize human faces and remember them... so be nice.",
      "Did you know? Hummingbirds are the only birds that can fly backwards.",
      "Fun fact: Pigeons can do complex math. Just kidding, but we are very smart!"
    ]
  }
};

export function getAnimalCategory(petType) {
  if (petType.includes('Cat')) return 'Cat';
  if (petType.includes('Dog')) return 'Dog';
  if (petType.includes('Rat')) return 'Rat';
  if (petType.includes('Bird')) return 'Bird';
  return 'Cat';
}
