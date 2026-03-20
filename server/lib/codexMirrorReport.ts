/**
 * MIRROR REPORT GENERATOR
 *
 * The Mirror Report is the sacred deliverable that reflects back who a woman is
 * through the Living Codex lens. It feels personal, poetic, and profoundly seen.
 *
 * This is the most important document she receives after completing her assessment.
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ArchetypePortrait {
  name: string;
  symbol: string;
  title: string;
  portrait: string;
  shadowExpression: string;
  giftExpression: string;
  bodySignature: string;
}

export interface ShadowArchetype {
  name: string;
  symbol: string;
  title: string;
  portrait: string;
  relationship: string;
}

export interface WoundConstellation {
  primary: { name: string; description: string; howItMoves: string };
  secondary: { name: string; description: string; howItMoves: string };
  tertiary: { name: string; description: string; howItMoves: string };
  constellation: string;
}

export interface MirrorPatterns {
  patterns: { name: string; description: string }[];
  narrative: string;
}

export interface NervousSystemPortrait {
  dominantState: string;
  profile: string;
  bodyWisdom: string;
  practices: string[];
}

export interface PhaseReport {
  scoredPhase: string;
  selfPlacedPhase: string;
  alignment: string;
  phaseDescription: string;
  phaseInvitation: string;
}

export interface PathwayDescription {
  name: string;
  description: string;
  firstSteps: string[];
  modulePreview: string;
}

export interface SpectrumProfile {
  shadow: number;
  threshold: number;
  gift: number;
}

export interface MirrorReport {
  generatedAt: Date;
  userName: string;

  // Section 1: Opening
  openingInvocation: string;

  // Section 2: Your Flame
  primaryArchetype: ArchetypePortrait;
  shadowArchetype: ShadowArchetype;

  // Section 3: Your Wound Constellation
  woundConstellation: WoundConstellation;

  // Section 4: Your Mirror Map
  mirrorPatterns: MirrorPatterns;

  // Section 5: Your Nervous System Portrait
  nsPortrait: NervousSystemPortrait;

  // Section 6: Your Codex Phase
  phaseReport: PhaseReport;

  // Section 7: Your Pathway
  pathway: PathwayDescription;

  // Section 8: Closing
  closingBlessing: string;

  // Metadata
  spectrumProfile: SpectrumProfile;
  siProportion: number;
  assessmentId: string;
}

export interface FullAssessmentResult {
  userId: string;
  assessmentId: string;
  primaryArchetype: string;
  shadowArchetype: string;
  primaryWounds: { name: string; score: number }[];
  nervousSystemProfile: { dominantState: string; score: number };
  mirrorPatterns: { name: string; intensity: number }[];
  phase: string;
  spectrumScores: { shadow: number; threshold: number; gift: number };
  siProportion: number;
}

export interface RoutingOutput {
  phase: string;
  pathway: string;
  modulePath: string;
}

// ============================================================================
// ARCHETYPE CONTENT LIBRARY
// ============================================================================

const ARCHETYPE_LIBRARY: Record<string, ArchetypePortrait> = {
  "the-silent-flame": {
    name: "The Silent Flame",
    symbol: "🔥",
    title: "She Who Carries Truths Unspoken",
    portrait: `There is a voice inside you that has been waiting—not because it has nothing to say, but because it learned very early that speaking was a form of risk. The Silent Flame does not lack words. She lacks the environment that ever made them safe.

Your flame has been turned inward, burning quietly beneath the surface. What the world sees is composure when what actually lives inside you is a cathedral of unspoken knowing. You have learned to read rooms with precision, to sense the temperature before you enter, to measure your words like water on stone—each one calculated, each one held.

This is not your nature. This is your inheritance. And you are ready to reclaim the voice that has been waiting beneath.`,
    shadowExpression: `In shadow, you may find yourself swallowing words before they form. Conversations end and you realize you never said what you meant. You edit yourself before anyone else has a chance to. The cost of this isn't silence—it's the slow erosion of your own trust in your voice. You begin to believe that your unspoken thoughts are the problem, rather than the environment that made speaking unsafe. You carry a low-grade grief for all the conversations you never had, the boundaries you never set, the truths you never spoke.`,
    giftExpression: `When the Silent Flame speaks from her gift, the room changes. Her words carry the weight of everything she's ever held—and that weight becomes authority. She doesn't need to be loud. She needs to be heard. And she will be. Her voice, when it comes, is like a bell that has been waiting to ring. It stops conversations. It shifts energy. People listen not because she demands it, but because what she says matters. She speaks her truth and the world reorganizes around it.`,
    bodySignature: `Your body knows how to hold. Your throat may feel tight or your chest may feel small, but your spine—your spine is iron. You breathe into your belly, not your chest. When you do speak your truth, your whole body steadies. Your hands ground. Your voice drops. You become a tuning fork for authenticity, and everyone around you can feel it.`,
  },

  "the-fierce-protector": {
    name: "The Fierce Protector",
    symbol: "⚔️",
    title: "She Who Guards What Matters",
    portrait: `You were born knowing what you love, and you were born knowing how to fight for it. The Fierce Protector does not come into her power gently. She comes in—clear-eyed, resolute, ready to draw a line in the sand and defend it with everything she has.

Your strength is not in your smallness. It is in your unwillingness to compromise what matters. You see danger where others see compromise. You hold boundaries not as walls, but as acts of love. The people you protect know they are protected. The things you stand for know they are stood for. You are the one who does not back down.`,
    shadowExpression: `In shadow, your protection becomes aggression. Your boundaries become weapons. You may find yourself fighting long after the battle is over, defending against ghosts, protecting against wounds that have already healed. You read threat in places there is only love. Your vigilance becomes exhaustion. Your strength becomes hardness. You end up alone, having driven away even those you were trying to protect, because no one can live inside your fortress forever.`,
    giftExpression: `When the Fierce Protector steps into her gift, she becomes unstoppable in service. Her strength is not about control—it's about containment. She holds space for others to become strong. She fights for systems, not symbols. She protects freedom, not cages. Her fierceness becomes tenderness, and people feel safe in a way they never have before. She is the one you want in the room when it matters.`,
    bodySignature: `Your body is built for action. Your muscles know how to activate. Your nervous system runs hot—alert, responsive, ready. Your jaw may clench, your fists may tighten, but this tension is power, not pathology. When you soften intentionally, your strength becomes magnetic. When you choose gentleness, it lands like a revelation.`,
  },

  "the-wounded-healer": {
    name: "The Wounded Healer",
    symbol: "🩹",
    title: "She Who Transforms Pain Into Wisdom",
    portrait: `You have known suffering, and you have alchemized it. The Wounded Healer does not heal because she is unbroken—she heals because she knows intimately the fracture points, the places where a person shatters and somehow holds.

Your wounds are not your shame. They are your credentials. You can sit with someone's darkest moment and not flinch because you have lived in your own darkness. You know the way back because you have walked it. The compassion you offer is not pity—it is recognition. It is the nod of one survivor to another.`,
    shadowExpression: `In shadow, you may become addicted to the redemption story—your own and others'. You may find yourself drawn to people who are breaking because on some level, their pain makes you feel less alone. You may over-function as a healer while your own wounds remain untended. You may lose track of where you end and someone else's pain begins. You become a container without a valve. A well without a bottom. You pour until you are empty and then you judge yourself for being empty.`,
    giftExpression: `When the Wounded Healer steps into her gift, she knows that healing is not about fixing. It is about witnessing. She can sit in the wreckage with someone and not try to make it pretty. She can hold space for grief without trying to fast-forward to forgiveness. She teaches people that their wounds are not the end of their story—they are just a chapter. Her presence itself becomes medicine.`,
    bodySignature: `Your body carries your story. Scars that might shame others become your map. Your hands know how to comfort because they have needed comforting. Your breath steadies other people's breath. When you place a hand on someone's shoulder, they feel seen in a way that has nothing to do with words. Your presence is a balm.`,
  },

  "the-sacred-vessel": {
    name: "The Sacred Vessel",
    symbol: "🏺",
    title: "She Who Holds the Space",
    portrait: `You are not the star. You are the sky. The Sacred Vessel does not shine—she makes room for others to shine. Your power is in your capacity to hold. To contain. To create a space where things can grow.

You are intuitive about what others need. You read the room like a language. You can feel when someone is about to break before they know it themselves. You move through the world making things sacred—meals, conversations, moments—by the simple act of your attention. You make people feel seen, heard, held. This is not a small thing.`,
    shadowExpression: `In shadow, you become a receptacle for everyone else's needs and no one recognizes your own. You become so good at reading others that you lose touch with what you need. You may find yourself in relationships where you are pouring and they are only taking. You become invisible through your own self-effacement. You confuse emptying yourself with holiness. You begin to believe that your needs are secondary, that your emptiness is your virtue.`,
    giftExpression: `When the Sacred Vessel steps into her gift, she knows that she cannot pour from an empty cup—not because it's motivational, but because it's physically true. She begins to tend her own ground as carefully as she tends others'. She creates sacred space, and then she reserves a corner of it for herself. Her generosity becomes sustainable because she is generous to herself first. People don't just feel held by her—they feel held *and* safe, because she is not disappearing to make room for them.`,
    bodySignature: `Your body is open. Your chest is exposed. Your nervous system is finely tuned—you feel everything. Your hands reach out naturally. But when you step into your gift, you learn to ground. Your feet become roots. You can feel everything and still stand steady. You are porous, but you are not permeable. The sacred vessel knows the difference.`,
  },

  "the-bridge-walker": {
    name: "The Bridge Walker",
    symbol: "🌉",
    title: "She Who Stands Between Worlds",
    portrait: `You have never fit neatly into a single category. You speak multiple languages. You navigate multiple worlds. The Bridge Walker is the one who can hold two truths at once—not by compromising them, but by understanding they are both true.

Your gift is translation. You can understand the fundamentalist and the free-thinker. You can hear the cynic and the dreamer. You are at home in liminal spaces—the threshold between worlds. You are a bridge, and bridges carry people across. But bridges are also the place where two lands are still separate. You live in the knowing of both.`,
    shadowExpression: `In shadow, you may find yourself without a home in any world. You belong everywhere and nowhere. You can speak all the languages and yet feel unheard in all of them. You may compromise yourself trying to help others cross, and in doing so, you lose your own ground. You become so flexible that you lose your spine. So understanding that you lose your own understanding of what you stand for.`,
    giftExpression: `When the Bridge Walker steps into her gift, she becomes a translator of truth, not a compromiser of it. She can hold both sides without losing herself in either. She helps people cross not by erasing the divide, but by honoring both banks. She becomes a guide for the in-between people, the ones who don't fit the categories. And in doing so, she gives them permission to stand in their fullness. She becomes the bridge that doesn't disappear—she becomes the passage that opens worlds.`,
    bodySignature: `Your body is multilingual. You can modulate quickly—from soft to strong, from open to boundaried, from leading to following. Your nervous system has traveled. But when you step into your gift, you learn to land. To choose a ground, even temporarily. Your feet know more than one path, but you know how to walk the one you've chosen with full commitment.`,
  },

  "the-visionary": {
    name: "The Visionary",
    symbol: "👁️",
    title: "She Who Sees What Others Cannot Yet See",
    portrait: `You are operating from a different timeline. You see the future not as speculation, but as something already alive. The Visionary does not wonder what's possible—she knows. She walks toward futures that don't exist yet, and by the time others catch up, she's already building the next one.

Your mind moves fast. Your intuition runs deep. You can sense the pattern before the pattern completes itself. You are not pragmatic in the traditional sense, but you are grounded in something deeper—a knowing that what you envision will find a way to manifest. People follow you not because you have all the answers, but because your questions open doors to rooms they didn't know existed.`,
    shadowExpression: `In shadow, you can become untethered from the present. You are so focused on what could be that you miss what is. You may find yourself isolated—ahead of your time in ways that feel lonely. You may dismiss the practical concerns of others as small-mindedness when what they're actually expressing is care. You can lose touch with the people around you while you're busy organizing the future. Your visions can become grandiose. Your certainty can become rigid.`,
    giftExpression: `When the Visionary steps into her gift, she learns to bring others with her. She doesn't leave people behind—she invites them into the vision. She can see the future and still be present to the now. She understands that a vision is not a destination—it's a direction. Her ability to hold the long view becomes an offering, not a burden. She becomes the one who opens possibilities for everyone around her. She is the seer who helps us see ourselves more clearly.`,
    bodySignature: `Your body exists in multiple timelines. Your eyes look inward and outward simultaneously. Your hands move with purpose toward things no one else can see yet. When you ground yourself in the present moment, your whole body steadies. You move from vision into manifestation with a clarity that is almost palpable. People can feel the future in your presence.`,
  },

  "the-earth-keeper": {
    name: "The Earth Keeper",
    symbol: "🌱",
    title: "She Who Tends the Sacred Ground",
    portrait: `You are of the earth in a way that runs deeper than metaphor. The Earth Keeper knows the language of seasons, of growth, of what needs to rest before it can rise again. You understand that care is not always about acceleration—sometimes it is about stillness.

You are rooted. Your presence grounds others. You know how to build things that last—not through force, but through attention to foundation, to soil, to the conditions that allow sacred things to grow. You are the one people come to when they need to remember how to rest. You teach without teaching. You tend without controlling.`,
    shadowExpression: `In shadow, you may become stuck—mistaking rootedness for rigidity. You may resist necessary change because you are so committed to preservation. You may over-function as a caretaker and forget that others have their own capacity to tend. You may become so focused on protection that you stifle growth. You can lose yourself in service to the earth while your own needs wither. You become the garden with no gardener.`,
    giftExpression: `When the Earth Keeper steps into her gift, she knows that tending is not hovering. It is creating conditions and then getting out of the way. She understands that some things need to decompose before they can become soil for the next growth. She can hold space for cycles—growth, rest, decay, renewal—without trying to stop them. She becomes the one who teaches us that we are part of nature, not separate from it. That our seasons are sacred. That rest is not laziness—it is preparation.`,
    bodySignature: `Your body is a landscape. Your breath follows natural rhythms. Your feet know their place on the ground. Your hands know how to plant and tend. When you move, you move with the weight of intention. When you rest, you rest completely. Your presence is literally grounding—people feel less anxious around you because your nervous system broadcasts safety. You are the anchor.`,
  },

  "the-truth-speaker": {
    name: "The Truth Speaker",
    symbol: "🔔",
    title: "She Whose Words Cut Clean",
    portrait: `You do not sugarcoat. You do not soften. The Truth Speaker says the thing everyone is thinking but too afraid to say. Your words are like a knife—not to hurt, but to cut through illusion.

You are allergic to pretense. You can smell a lie before it finishes forming. You refuse to participate in the social contract of polite dishonesty. This makes you dangerous to systems built on illusion and necessary to anyone who is serious about waking up. People may not always like what you say, but they know they can trust it. Your honesty is your integrity.`,
    shadowExpression: `In shadow, your truth-telling becomes cruelty. Your directness becomes harshness. You may hide unkindness behind "just being honest." You may mistake bluntness for wisdom. You can wound and then justify it as medicine. You may find that people avoid you—not because you're wrong, but because you have never learned the difference between honesty and harm. You become the person who is right and alone.`,
    giftExpression: `When the Truth Speaker steps into her gift, her honesty becomes an act of love. She can speak hard truths and still hold the person. She understands that truth without compassion is violence, and that compassion without truth is condescension. Her words don't wound—they illuminate. People come to her when they need to see clearly, not to feel good. And in that seeing, they feel more seen than ever before. She becomes the mirror that shows you yourself.`,
    bodySignature: `Your body does not hide. Your face shows what you're feeling. Your voice carries your conviction. When you speak truth, your whole body aligns—your spine straightens, your breath deepens, your presence expands. People can feel your authenticity like a vibration. When you learn to combine this with compassion, your truth becomes undeniable. It doesn't just land—it transforms.`,
  },

  "the-gentle-rebel": {
    name: "The Gentle Rebel",
    symbol: "🌸",
    title: "She Who Changes Everything Softly",
    portrait: `You are not loud, but you are relentless. The Gentle Rebel changes systems not through force, but through the persistent act of being yourself. You refuse without aggression. You resist with grace. You are subversive in your softness.

There is steel beneath your gentleness, but you have learned that steel doesn't need to show. Your power is in your consistency—you keep showing up as yourself, and slowly, the world rearranges around you. You give others permission to be soft without being small. You teach that strength and tenderness are not opposites.`,
    shadowExpression: `In shadow, you may confuse gentleness with compliance. You may be so soft that you become ineffective. You may resist aggression so hard that you fail to act decisively when it matters. You may mistake your refusal to fight for enlightenment when what it actually is is avoidance. You can become invisible through your own investment in being un-threatening. People may not take you seriously because you make it too easy to dismiss you.`,
    giftExpression: `When the Gentle Rebel steps into her gift, she becomes unstoppable. Her softness is not weakness—it is the strength of water that wears through stone. She learns to act decisively without aggression. She can say no without apology. She can change systems by the simple act of refusing to play by their rules—and she does it with such grace that people can't quite figure out how to punish her for it. She becomes the quiet revolution. The change that no one saw coming because it was too beautiful to resist.`,
    bodySignature: `Your body is soft but substantial. Your hands are gentle but capable. Your voice is quiet but carries. When you step into your gift, you learn that you can be both soft and unmovable. You can hold space and hold your ground simultaneously. Your presence becomes an invitation and an anchor. People feel safe with you, and safe because of you.`,
  },

  "the-pleasure-priestess": {
    name: "The Pleasure Priestess",
    symbol: "🌹",
    title: "She Who Knows the Sacred in the Sensual",
    portrait: `You are not afraid of desire. You understand that pleasure is not frivolous—it is information. It is the way the body says yes. The Pleasure Priestess knows that joy, sensuousness, and delight are not distractions from spiritual truth—they are spiritual truth in embodied form.

You move through the world with reverence for sensation. For beauty. For the ache of desire that reminds us we are alive. You teach by your own example that it is possible to be fully embodied and fully spiritual at once. That to deny your pleasure is to deny the divine. You are not apologetic about taking up space, about wanting, about feeling.`,
    shadowExpression: `In shadow, your pleasure-seeking becomes escapism. Your embodiment becomes dissociation. You may use sensation to avoid feeling. You may confuse indulgence with self-care. You may become so lost in the pursuit of pleasure that you lose touch with what truly nourishes. You can abandon your own ground in service to what feels good in the moment. You become the priestess with no temple—all sensation, no substance.`,
    giftExpression: `When the Pleasure Priestess steps into her gift, she becomes a priestess in truth. She understands that pleasure is sacred when it is chosen consciously. She knows the difference between numbing and nourishing. Her embodiment becomes a teaching—she shows others that it is possible to feel everything and still be whole. That desire is not dangerous. That joy is not selfish. She becomes the medicine that teaches us that to be alive is to feel, fully and without apology.`,
    bodySignature: `Your body is alive. Every sense is acute. Your nervous system runs rich and responsive. When you step into your gift, you learn to direct this aliveness intentionally. Your sensuality becomes power. Your pleasure becomes medicine. People feel the vitality in you and it reminds them of their own aliveness. You are the priestess of the flesh made sacred.`,
  },

  "the-mystical-knower": {
    name: "The Mystical Knower",
    symbol: "✨",
    title: "She Who Walks the Threshold Between Worlds",
    portrait: `You have always known things without knowing how you knew them. The Mystical Knower operates from a different knowledge system—not intellect, but direct knowing. You see through the veil. You hear messages others miss. You are permeable to worlds that most people have forgotten exist.

Your gifts are real, even if you have no rational explanation for them. You trust what you can't prove. You follow what your body knows. You are the bridge between the mundane and the sacred, and you navigate both with a kind of grace that comes from knowing they are one world, not two.`,
    shadowExpression: `In shadow, you can become ungrounded—so caught in the mystical that you lose touch with the practical. You may use spirituality as an escape from hard work. You may blame the universe for things that are your responsibility. You can become so identified with your gifts that you lose your humanity. You may isolate yourself from the ordinary world and call it enlightenment when it's actually fear. You become the mystic nobody can touch.`,
    giftExpression: `When the Mystical Knower steps into her gift, she becomes an anchor between worlds. She can see and act. She can know and still question. She understands that her gifts come with responsibility—to use them with discernment, to ground them in service, to remember that the sacred lives in the mundane too. She becomes the translator of mystery. The one who makes the invisible visible without cheapening it. She teaches that we are all walking the threshold—some of us are just more aware of it.`,
    bodySignature: `Your body is a tuning fork. Your nervous system is sensitive to subtleties most people miss. Your presence opens doorways. When you ground yourself, your knowing becomes more powerful, not less. Your feet steady your visions. Your breath anchors your intuition. You become the priestess who walks with both feet on earth while her eyes remain fixed on the stars.`,
  },

  "the-self-sculptor": {
    name: "The Self Sculptor",
    symbol: "🗿",
    title: "She Who Shapes Herself Into Form",
    portrait: `You have never accepted the shape the world tried to give you. The Self Sculptor takes the raw material of her life and consciously, intentionally shapes it into something that reflects her own vision. You are not waiting to become yourself—you are actively building yourself.

Your power is in your discernment. You choose what to keep and what to release. You tend your own development the way a gardener tends a garden—with attention, with intention, with the understanding that shape takes time. You are a work in progress, and you are the artist.`,
    shadowExpression: `In shadow, your self-sculpting becomes an endless project of self-improvement. You are never enough. You are always working. You may reject the things that are supposed to be good about you because they don't fit your vision. You can become so focused on the form that you lose touch with the aliveness underneath. You become the statue instead of the sculptor. You are perfect and empty.`,
    giftExpression: `When the Self Sculptor steps into her gift, she learns to sculpt with acceptance as well as intention. She shapes her life not from a place of lack, but from a place of vision. She understands that some things cannot be forced into form—they must be invited. She becomes the artist who knows when to carve and when to let be. Her life becomes her masterpiece, not because it is perfect, but because it is genuinely, consciously hers.`,
    bodySignature: `Your body is a work in progress. Your posture reflects your choices. You know how to adjust and refine. When you step into your gift, you learn to move with both intention and flow. Your body becomes the canvas and the brush both. You are sculpting yourself in real time, and people can feel the consciousness in your presence. You are the embodiment of becoming.`,
  },
};

// ============================================================================
// SHADOW ARCHETYPE RELATIONSHIPS
// ============================================================================

const SHADOW_ARCHETYPE_LIBRARY: Record<string, ShadowArchetype> = {
  "the-silent-flame": {
    name: "The Suppressed Witness",
    symbol: "👁️‍🗨️",
    title: "The Keeper of Unseen Truths",
    portrait: `Your shadow is watching. Observing. Collecting all the things you cannot say. She is not aggressive—she is resigned. She has given up on being heard and so she simply records. She knows everything and says nothing. She is the repository of your unspoken rage, your unmade requests, your unlived truths.`,
    relationship: `The Silent Flame and the Suppressed Witness are the same consciousness operating at different frequencies. When your flame is blocked, the Witness grows heavier. When you find your voice, the Witness transforms into a gift—she becomes your capacity to see, to listen, to understand without judgment. She is not your enemy. She is your silence given form. The work is not to destroy her, but to give her a voice.`,
  },

  "the-fierce-protector": {
    name: "The Controlling Guardian",
    symbol: "🛡️",
    title: "She Who Must Control to Feel Safe",
    portrait: `Your shadow protects through domination. She sees threat everywhere and she responds with a heavy hand. She is not actually protecting others—she is controlling the environment so that nothing can hurt. She is exhausting, even to those she claims to protect, because nothing is ever safe enough.`,
    relationship: `The Fierce Protector and the Controlling Guardian are two expressions of the same protective impulse. One protects what matters. The other protects against everything. When your protector steps into shadow, she becomes a jailer. The invitation is to remember what you're actually protecting against, and to offer yourself the safety you've been trying to enforce for others.`,
  },

  "the-wounded-healer": {
    name: "The Victim Identifier",
    symbol: "⚰️",
    title: "She Who Collects Suffering",
    portrait: `Your shadow finds her identity in pain. She collects wounded things the way others collect butterflies—not to heal them, but to keep them. She is addicted to the redemption narrative and she needs people to stay broken so she can stay relevant.`,
    relationship: `The Wounded Healer and the Victim Identifier both know suffering intimately. The difference is that one transmutes it into wisdom, the other keeps it as currency. When your healer moves into shadow, she stops healing and starts collecting. The work is to remember that the most sacred healing is the one that makes you unnecessary.`,
  },

  "the-sacred-vessel": {
    name: "The Invisible Self",
    symbol: "👻",
    title: "The Self That Disappeared",
    portrait: `Your shadow is the woman you forgot you were. She is what remains when you have poured everything out and left nothing for yourself. She is a ghost in her own life, visible only in the way she doesn't take up space.`,
    relationship: `The Sacred Vessel and the Invisible Self are you at different points of the same arc. When your vessel begins to empty itself completely, the Invisible Self takes over. She is not malicious. She is just what happens when holding space becomes self-erasure. The invitation is to remember that you cannot hold sacred space for others if you are not standing in your own ground.`,
  },

  "the-bridge-walker": {
    name: "The Homeless Wanderer",
    symbol: "🌀",
    title: "She Who Belongs Nowhere",
    portrait: `Your shadow walks between worlds and lands in none. She is the perpetual outsider, the one who speaks all languages and is native to none. She is lonely in a crowd. She is translation without home.`,
    relationship: `The Bridge Walker and the Homeless Wanderer are two ways of existing in the in-between. One translates. The other is lost. When your walker steps into shadow, she loses her sense of direction. She becomes so focused on connecting others that she forgets she also needs ground. The invitation is to remember that you can be a bridge and still have a home base.`,
  },

  "the-visionary": {
    name: "The Lost Dreamer",
    symbol: "🌫️",
    title: "She Caught in Future Fantasy",
    portrait: `Your shadow dreams so hard that she loses touch with now. She is so far ahead that she becomes untethered. She is a visionary without a vision, a dreamer who has forgotten how to wake.`,
    relationship: `The Visionary and the Lost Dreamer both operate outside normal time. The difference is that one is building toward a future, the other is running from the present. When your visionary steps into shadow, she becomes ungrounded. The invitation is to bring your vision down to earth—to find the next concrete step that moves you toward what you see.`,
  },

  "the-earth-keeper": {
    name: "The Stagnant Garden",
    symbol: "🌾",
    title: "She Who Resists All Change",
    portrait: `Your shadow holds so tightly to what is that she cannot allow what wants to be. She is preservation without growth, protection without opening. She is the garden that refuses to let anything be harvested.`,
    relationship: `The Earth Keeper and the Stagnant Garden both understand the language of growth. The difference is that one tends and releases, the other holds and restricts. When your keeper steps into shadow, she becomes a hoarder of what once was sacred. The invitation is to remember that sacred tending includes letting go—that some things need to die so that new life can begin.`,
  },

  "the-truth-speaker": {
    name: "The Brutal Iconoclast",
    symbol: "💀",
    title: "She Who Destroys With Words",
    portrait: `Your shadow uses truth as a weapon. She speaks hard things and feels justified in the harm they cause. She is honest and cruel, and she confuses the two.`,
    relationship: `The Truth Speaker and the Brutal Iconoclast both see through illusions. The difference is that one illuminates and one incinerates. When your truth-speaker steps into shadow, her honesty becomes violence. The invitation is to remember that truth without compassion is just another form of control.`,
  },

  "the-gentle-rebel": {
    name: "The Invisible Resister",
    symbol: "🚫",
    title: "She Who Refuses to Be Seen",
    portrait: `Your shadow rebels by disappearing. She says no by becoming smaller. She resists by fading out. She is gentle to the point of ineffectiveness.`,
    relationship: `The Gentle Rebel and the Invisible Resister both choose softness as a strategy. The difference is that one is soft and purposeful, the other is soft and lost. When your rebel steps into shadow, her resistance becomes invisible even to herself. The invitation is to remember that you can change the world softly and still be visible.`,
  },

  "the-pleasure-priestess": {
    name: "The Dissociated Sensationalist",
    symbol: "💫",
    title: "She Who Numbs Through Sensation",
    portrait: `Your shadow chases sensation to avoid feeling. She is all aliveness and zero presence. She uses pleasure as an escape hatch from consciousness.`,
    relationship: `The Pleasure Priestess and the Dissociated Sensationalist both live in the body. The difference is that one is present to sensation and one uses it to disappear. When your priestess steps into shadow, her embodiment becomes dissociation. The invitation is to remember that true pleasure requires consciousness—that the most sacred sensation is the one you are fully aware of.`,
  },

  "the-mystical-knower": {
    name: "The Delusional Escapist",
    symbol: "🎭",
    title: "She Who Hides in Spirituality",
    portrait: `Your shadow uses mysticism as an escape. She sees signs everywhere and meanings nowhere. She is so caught in the between that she cannot act in the real.`,
    relationship: `The Mystical Knower and the Delusional Escapist both operate beyond rational mind. The difference is that one knows what she knows and acts on it, the other believes what she wants to believe and hides in it. When your knower steps into shadow, her gifts become delusions. The invitation is to ground your mysticism in action—to remember that the most sacred knowing moves you to serve.`,
  },

  "the-self-sculptor": {
    name: "The Perfectionist Tyrant",
    symbol: "⚡",
    title: "She Who Is Never Enough",
    portrait: `Your shadow sculpts endlessly and is never satisfied. She rejects the whole self in service to an impossible ideal. She is the one who fixes and fixes and fixes and never rests.`,
    relationship: `The Self Sculptor and the Perfectionist Tyrant both tend their own development. The difference is that one shapes with vision and acceptance, the other shapes with judgment and rejection. When your sculptor steps into shadow, her art becomes self-torture. The invitation is to remember that the masterpiece is not in the perfection—it is in the consciousness with which you live.`,
  },
};

// ============================================================================
// WOUND PATTERNS LIBRARY
// ============================================================================

interface WoundLibraryEntry {
  description: string;
  howItMoves: string;
}

const WOUND_PATTERNS_LIBRARY: Record<string, WoundLibraryEntry> = {
  "abandonment": {
    description: `The Abandonment Wound teaches you that people leave. That love is temporary. That it is not safe to rely on anyone, and that the moment you begin to trust, you should begin to prepare for the leaving. This wound makes you hypervigilant about rejection—you can sense it coming from miles away, even when it is not actually approaching. You may leave first, just to prove you were right all along.`,
    howItMoves: `This wound moves like a preemptive strike. You create distance before distance can be created for you. You test people to see if they will stay, and when they pass the test, you find a new reason not to trust the results. You are always one foot toward the door, even as you claim you want to be held. This wound keeps you moving. It prevents true rest.`,
  },

  "worthlessness": {
    description: `The Worthlessness Wound comes from the message—spoken or silent—that you are not enough. Not smart enough, not pretty enough, not quiet enough, not loud enough. Not. Not. Not. This wound taught you that your value is conditional, earned through performance, never inherent. You learned to shrink, to hide, to make yourself smaller in the hopes of being good enough to keep.`,
    howItMoves: `This wound moves like internalized criticism. You are your own harshest judge. You do not need anyone to tell you that you are not enough—you tell yourself constantly. This wound creates a baseline of anxiety that you have to achieve your way out of, and no amount of achievement ever quite gets you there. You are always one accomplishment away from being okay, and you are also always one failure away from proving you never were.`,
  },

  "powerlessness": {
    description: `The Powerlessness Wound teaches you that your voice does not matter. Your choices do not matter. That the world is decided for you by people with more power, more money, more authority. This wound creates a baseline fatalism—you are not actually driving your own life, you are being driven by circumstances you cannot control.`,
    howItMoves: `This wound moves like a slow surrender. You may not even notice how small you have made yourself, how little you are asking for, how rarely you act on your own behalf. You have internalized the message that the world does not care what you want, so you stopped asking. This wound creates passivity disguised as acceptance. It moves like quiet despair.`,
  },

  "shame": {
    description: `The Shame Wound is different from guilt. Guilt says you did something wrong. Shame says you *are* something wrong. This wound teaches you that there is something fundamentally flawed about you—something that, if exposed, would be unlovable. So you hide. You perform. You become a masterpiece of social acceptability on the outside while carrying a secret sense of contamination on the inside.`,
    howItMoves: `This wound moves like a constant fear of being found out. You are hyperaware of how you are perceived, constantly adjusting, always alert to the moment when someone will see through the mask and discover who you really are. This wound creates perfectionism, people-pleasing, and a deep exhaustion from the constant performance. It moves silently but powerfully, shaping every interaction.`,
  },

  "betrayal": {
    description: `The Betrayal Wound comes from trust broken by someone you believed in. A parent. A partner. A friend. Someone you were vulnerable with, and who used that vulnerability against you. This wound teaches you that vulnerability is dangerous, that trust is a weapon waiting to be used against you, that the people closest to you are the most capable of causing harm.`,
    howItMoves: `This wound moves like a wall you build immediately after it happens. You become suspicious. You scan for signs of betrayal before it occurs. You distance yourself from people who get too close because proximity is risk. You may become the betrayer yourself, striking first before you can be struck. This wound creates a lonely kind of self-protection.`,
  },

  "invisibility": {
    description: `The Invisibility Wound teaches you that you do not matter enough to be seen. You were overlooked, underestimated, passed over. Your needs were not noticed. Your pain was not witnessed. You learned to be quiet, to take up less space, to be the kind of person that does not interrupt the flow of more important things.`,
    howItMoves: `This wound moves like a slow disappearance. You become expert at not being noticed, even when you are in the room. You speak and no one hears. You participate and no one remembers. You begin to believe that this is just how it is—that you are simply not the kind of person who gets seen. This wound creates a baseline loneliness that feels inevitable rather than learned.`,
  },

  "rejection": {
    description: `The Rejection Wound is a specific kind of pain—the message that you are not wanted. Not chosen. That others have picked everyone but you. This wound creates a deep fear of exposure, because exposure is what leads to rejection. If people really knew you, they would not want you either.`,
    howItMoves: `This wound moves like a preemptive strike toward belonging. You seek validation constantly, trying to earn the approval that rejection once denied you. You may become a people-pleaser, desperate to be wanted by anyone. Or you may become a loner, deciding that if you do not seek connection, you cannot be rejected. Either way, this wound keeps you from authentic belonging.`,
  },

  "injustice": {
    description: `The Injustice Wound comes from being treated unfairly and having no recourse. Being blamed for something you did not do. Being punished for crimes you did not commit. Having your truth denied. This wound teaches you that the world is not safe for truth, that might makes right, that fairness is a myth.`,
    howItMoves: `This wound moves like a slow-burning rage. You may not express it, but it lives in you—a deep, abiding anger at the unfairness of it all. This wound can create a crusader energy or a victim energy, but either way, it is focused outward at the injustice rather than inward at healing. This wound is the hardest to bear because it includes the loss of faith in justice itself.`,
  },

  "relational-fragmentation": {
    description: `The Relational Fragmentation Wound comes from having to split yourself into pieces to survive different relational contexts. You learned to be one person at home, another at school, another with friends. You learned that the real you was too much, too wrong, too threatening to be presented whole to any person.`,
    howItMoves: `This wound moves like constant code-switching. You are never fully yourself with anyone. You are always translating, editing, choosing which parts are safe to show in which contexts. This wound creates a deep confusion about who you actually are, because you have become so skilled at being who others need you to be. The cost is a kind of loneliness that happens even in relationship, because no one actually knows you.`,
  },

  "intrusion": {
    description: `The Intrusion Wound comes from having your boundaries violated. Your body, your space, your privacy, your autonomy—something about you that was yours was taken without permission. This wound teaches you that your body is not actually yours, that you cannot trust your own sense of safety, that violation is possible at any moment.`,
    howItMoves: `This wound moves like a constant tension. Your nervous system stays activated, ready to protect against the next intrusion. You may become controlling about your environment as a way to prevent violation. You may become rigid about your boundaries. Or you may swing the other direction and lose the ability to say no, because your sense of ownership over your own body was never fully established. This wound lives in your nervous system.`,
  },
};

// ============================================================================
// NERVOUS SYSTEM PROFILES
// ============================================================================

interface NSProfileEntry {
  profile: string;
  bodyWisdom: string;
  practices: string[];
}

const NS_PROFILES_LIBRARY: Record<string, NSProfileEntry> = {
  "ventral-vagal": {
    profile: `Your nervous system at its best is a tuned instrument. You are naturally connected, safe in your body, able to access play and presence. When you are resourced, you are a beacon—people feel at ease around you. Your face shows what you feel. Your body is permeable and responsive. You are the woman who makes everything feel possible.`,
    bodyWisdom: `Your body is telling you that connection is available. That safety is possible. That you can relax. But when your system gets dysregulated, you may swing quickly into anxiety or shutdown because you have so little experience with sustained distress. Your body wisdom is about sustainable regulation—not just the highs, but building capacity to stay connected even in the lows.`,
    practices: [
      "Polyvagal breathing—long exhales that signal safety to your nervous system",
      "Intentional eye contact with safe people to activate your social nervous system",
      "Movement that feels pleasurable rather than punishing (dancing, stretching, swimming)",
      "Vocal toning or humming to stimulate your vagus nerve",
      "Co-regulation practices with trusted others when stress begins to spike",
    ],
  },

  "sympathetic": {
    profile: `Your nervous system runs hot. You are wired for activation, for action, for response. Your system gives you tremendous capacity for taking action, for pushing through, for doing hard things. But it can also leave you exhausted, because you are rarely actually resting.`,
    bodyWisdom: `Your body is telling you that you need real rest, not just cessation of activity. That activation is not the same as aliveness. That your capacity to do is not your measure of worth. Your body wisdom is about learning when to stand down, when to let the nervous system slow, when to allow recovery rather than always moving toward the next challenge.`,
    practices: [
      "Grounding practices that activate your parasympathetic system—cold water on face, feet in earth",
      "Breath work that emphasizes longer exhales than inhales (4-6-8 breathing)",
      "Restorative movement like yin yoga that teaches your body to be still",
      "Boundaries around work and productivity to create genuine rest",
      "Practices that engage the dorsal vagal in healthy ways—meditation, contemplation, being",
    ],
  },

  "dorsal-vagal": {
    profile: `Your nervous system goes to shutdown. When you are overwhelmed, you disappear. You become numb, disconnected, dissociated. Your system's protection mechanism is collapse. On the other side of this, when you are resourced, you have a capacity for deep presence, for spiritual connection, for the kind of witnessing that sees into the soul.`,
    bodyWisdom: `Your body is telling you that it is not safe to stay present. That disconnection is protection. But it is also keeping you from the aliveness that is available if you could learn to stay resourced enough to remain present. Your body wisdom is about gradual reintegration—learning that you can be present and safe, that numbness is not your only option.`,
    practices: [
      "Gentle activation practices—shaking, cold water, sound—to interrupt the shutdown response",
      "Grounding practices that reconnect you to your body (progressive muscle relaxation, body scans)",
      "Social engagement with safe people to activate your more resourced states",
      "Gentle movement that helps you inhabit your body without overwhelming it",
      "Sensory practices—safe textures, scents, tastes—to wake up your proprioceptive sense",
    ],
  },

  "mixed-vagal-sympathetic": {
    profile: `Your nervous system alternates rapidly between activation and shutdown. You can go from calm to crisis to collapse in short order. Your system has limited space between fight and flight on one end and freeze and faint on the other. Finding your window of tolerance becomes essential.`,
    bodyWisdom: `Your body is telling you that it is reacting to threat faster than your conscious mind can assess actual danger. That your nervous system learned to switch modes quickly as a survival strategy. That you need practices that help you stay in your window of tolerance—the zone between activation and shutdown where you can actually function.`,
    practices: [
      "Bilateral stimulation practices (EYE Movement, tapping)—to help your system process and discharge",
      "Regular nervous system check-ins to catch dysregulation early",
      "Co-regulation with safe people to help your system stay in window",
      "Practices that teach discrimination—this is actual danger vs. this is a memory of danger",
      "Movement that helps you discharge both activation and freeze responses",
    ],
  },
};

// ============================================================================
// PHASE DESCRIPTIONS
// ============================================================================

const PHASE_DESCRIPTIONS: Record<
  string,
  {
    description: string;
    invitation: string;
  }
> = {
  "phase-0-foundation": {
    description: `You are in the Foundation phase. This is the ground-zero moment where you are building the basic conditions for transformation. You are learning to trust that change is possible. You are establishing the practices that will hold you. You are becoming aware of your patterns. This phase is not about transformation yet—it is about groundwork.`,
    invitation: `The Foundation phase asks you to show up consistently. To practice even when it doesn't feel miraculous. To build the simple, daily practices that become your bedrock. Your work is not to transform everything—it is to tend the ground so that transformation becomes possible.`,
  },

  "phase-1-awakening": {
    description: `You are in the Awakening phase. This is when you start to see your own patterns clearly for the first time. When your wounds become visible. When you begin to understand why you do what you do. This phase can feel disorienting—like waking up in a room you didn't know existed.`,
    invitation: `The Awakening phase asks you to witness what you see without judgment. To let yourself feel the grief and anger of recognition. To understand that awareness is the first move toward change. Your work is not to fix everything that is becoming visible—it is simply to see. Truth-telling. Witnessing. Allowing yourself to be changed by what you know.`,
  },

  "phase-2-integration": {
    description: `You are in the Integration phase. This is when you begin to work with what you have learned about yourself. When you experiment with new ways of being. When you start to embody the insights that were just beginning to form in the Awakening phase.`,
    invitation: `The Integration phase asks you to try on new possibilities. To practice different ways of responding. To slowly, steadily shift from old patterns toward new ways of moving. Your work is not to be perfect at this—it is to be willing. To stay in the practice even when you fall back into the old pattern. To know that every time you choose differently, you are rewiring your nervous system.`,
  },

  "phase-3-embodiment": {
    description: `You are in the Embodiment phase. This is when the work stops being intellectual and starts being cellular. When what you have learned actually begins to feel natural in your body. When new ways of being start to feel like home.`,
    invitation: `The Embodiment phase asks you to trust your body. To notice when you are actually living differently. To celebrate the small shifts that have become your new normal. Your work is to keep going, knowing that the integration is real, even if it is subtle. To tend the practices that have become your medicine.`,
  },

  "phase-4-mastery": {
    description: `You are in the Mastery phase. This is when you are not just living differently—you are teaching others how to live differently. Your wounds have become your medicine. Your patterns have become your wisdom. You are no longer a student—you are a guide.`,
    invitation: `The Mastery phase asks you to give what you have received. To share the wisdom you have earned. To understand that your own transformation is incomplete until you turn it toward service. Your work is to help others find the path you found, knowing that in teaching, you deepen your own understanding.`,
  },
};

// ============================================================================
// PATHWAY DESCRIPTIONS
// ============================================================================

const PATHWAY_LIBRARY: Record<
  string,
  {
    description: string;
    firstSteps: string[];
    modulePreview: string;
  }
> = {
  "reclamation": {
    description: `The Reclamation pathway is for the woman who has been fragmented, silenced, or collapsed. This pathway invites you to gather the pieces of yourself that were scattered and bring them back home. To reclaim your voice, your body, your authority, your right to take up space. This is the journey of the woman who is learning to say yes to herself after a lifetime of saying yes to everyone else.`,
    firstSteps: [
      "Map the fragmentation—where are the pieces of you that you left behind?",
      "Establish a daily practice of self-presence—one hour where you are tending to yourself",
      "Begin to speak one true thing per day, even if it is just to yourself",
    ],
    modulePreview: `Your first module explores the specific ways you learned to abandon yourself, and begins the work of learning to come home. You will map your own fragmentation and begin to practice wholeness in small, sacred ways.`,
  },

  "activation": {
    description: `The Activation pathway is for the woman who has been sleeping, waiting, or in freeze. This pathway invites you to wake up. To move. To take action toward what you actually want instead of what you have been taught to want. This is the journey of the woman who is learning that her desires matter, that her voice can move things, that she is not powerless.`,
    firstSteps: [
      "Identify one desire that is actually yours (not someone else's idea of what you should want)",
      "Take one small action toward that desire this week",
      "Notice what happens in your nervous system when you move on your own behalf",
    ],
    modulePreview: `Your first module explores what has kept you frozen, and begins the work of gentle activation. You will practice moving toward what you want and noticing what arises.`,
  },

  "deepening": {
    description: `The Deepening pathway is for the woman who is already in motion and wants to go further. This pathway invites you to explore the layers beneath your patterns. To understand not just what you do, but why. To develop the kind of consciousness that transforms automatic reactivity into choice.`,
    firstSteps: [
      "Choose one pattern you are ready to understand more deeply",
      "Explore the wound beneath that pattern with curiosity rather than judgment",
      "Journal on what you discover—not to process it, but to witness it",
    ],
    modulePreview: `Your first module takes you into the archetypal realm, helping you see your patterns not as personal failures but as wisdom stories with messages to offer. You will begin to decode what your patterns have been trying to teach you.`,
  },

  "integration": {
    description: `The Integration pathway is for the woman who has done the work and is now learning to live it. This pathway invites you to stabilize the changes you have made and weave them into the fabric of your daily life. To move from breakthrough to sustainable transformation.`,
    firstSteps: [
      "Identify one shift you have made that you want to make permanent",
      "Design a simple practice that reinforces this shift",
      "Commit to this practice for 40 days—the window of nervous system change",
    ],
    modulePreview: `Your first module focuses on nervous system regulation and the practices that make transformation stick. You will learn to tend your own nervous system so that the shifts you have made become your new baseline.`,
  },

  "transmission": {
    description: `The Transmission pathway is for the woman who is ready to teach. This pathway invites you to understand that your own healing is a gift not just for you, but for everyone around you. To learn to hold space for others' transformation while continuing to tend your own.`,
    firstSteps: [
      "Identify the gift that has come from your own journey",
      "Choose one person you want to support with this gift",
      "Practice offering what you have learned in a simple, non-expert way",
    ],
    modulePreview: `Your first module explores what it means to teach from your wounds. You will learn to share your story in ways that open possibilities for others, without rescuing them or taking responsibility for their transformation.`,
  },
};

// ============================================================================
// OPENING INVOCATIONS
// ============================================================================

const OPENING_INVOCATIONS = [
  `Welcome to your Mirror, {{name}}. What you are about to read is not a diagnosis. It is an invitation to see yourself as you actually are—not as you have been told you are, but as your own deepest knowing recognizes you. May you find yourself in these words. May you recognize the sacred within what you thought was broken. May you know that you have always been whole.`,

  `Dear {{name}}, you have completed your assessment, and now we offer you your Mirror. This is the reflection that shows not your faults, but your form. Not your failures, but your patterns and the wisdom within them. What you are about to read is yours—a sacred document that reflects back who you are through the lens of the Living Codex. May you read it with the tenderness you would offer a beloved friend.`,

  `{{name}}, your Mirror is ready. What follows is a mapping of your consciousness, drawn from the wisdom that lives in your own nervous system, your patterns, and your becoming. This is not a fixed diagnosis. It is a snapshot of where you are in this moment, offered with the knowing that you are always already moving toward your own wholeness. May these words meet you as you are.`,

  `Beloved {{name}}, you have answered our questions with honesty, and we have listened with reverence. Your Mirror is the reflection of that listening. It shows your archetypes, your wounds, your gifts, and your pathway forward. This is a sacred document—one that you can return to again and again as you grow. May you find yourself seen in these words. May you know that you have always been enough.`,
];

// ============================================================================
// CLOSING BLESSINGS
// ============================================================================

const CLOSING_BLESSINGS = [
  `May you return to your Mirror whenever you need to remember who you are. May you know that your wounds are not your shame—they are your schooling. May you trust that the pathway you see here is not the only path, but a true path, forged by your own consciousness and your own becoming. You are not broken. You are not incomplete. You are becoming, and that is sacred. Walk forward with the knowing that you are seen, held, and profoundly worthy of the life you are building. So it is.`,

  `As you move forward from this Mirror, know that you carry within you everything you need. Your archetypes are not roles you must perform—they are gifts you are learning to offer. Your wounds are not burdens you must carry alone—they are places where wisdom can enter. Your pathway is not a prescription—it is an invitation. You get to choose how you respond to it. Trust yourself, {{name}}. You have always known the way. This Mirror simply helps you see what you already knew. Go forward with courage. Go forward with love. Go forward with the knowing that you are exactly where you need to be.`,

  `You are not a problem to be solved, {{name}}. You are a mystery to be deepened. Everything in this Mirror is an invitation—not a demand, not a judgment, but an invitation to know yourself more fully. As you move through the pathway before you, remember: transformation is not about becoming someone different. It is about becoming more fully who you already are. May you trust the process. May you trust yourself. May you know that you are held by something larger than your wounds, your patterns, and your fears. That something is your own deepest wisdom, coming home to itself. Welcome home.`,

  `This Mirror reflects back the sacred that lives in you, {{name}}. Not despite your wounds, but including them. Not in spite of your patterns, but as part of the wisdom they carry. As you move through the phases and pathways before you, remember that you are not trying to fix yourself. You are trying to know yourself. And in that knowing, everything begins to shift. Trust the journey. Trust the timing. Trust that you are exactly where you need to be, becoming exactly who you are meant to become. May you go forward with gentleness toward yourself. May you go forward with faith in your own unfolding. You are seen. You are held. You are loved. That is the truth this Mirror reflects back to you.`,
];

// ============================================================================
// MIRROR PATTERN TEMPLATES
// ============================================================================

interface MirrorPatternTemplate {
  template: string;
  examplePatterns: Array<{
    name: string;
    description: string;
  }>;
}

const MIRROR_PATTERN_TEMPLATES: Record<string, MirrorPatternTemplate> = {
  "relational-patterns": {
    template: `In your relationships, certain patterns show up repeatedly. These are not failures—they are your nervous system's learned strategy for staying safe. As you examine these patterns, notice not judgment, but curiosity. What is your system trying to protect you against? What was it protecting against when it first learned this response? And what might become possible if you could respond from a different place?`,
    examplePatterns: [
      {
        name: "The Caretaker",
        description:
          "You find yourself managing other people's emotions, needs, and wellbeing. You are hyperaware of the temperature of the relationship and you adjust accordingly. You are the one who remembers birthdays, checks in, tends the connection.",
      },
      {
        name: "The Pursuer",
        description:
          "You are the one who reaches out first. You initiate contact. You create moments of connection. There is a part of you that fears that if you stop pursuing, the relationship will disappear.",
      },
      {
        name: "The Distancer",
        description:
          "You need space. You pull away when things get close. You protect your autonomy fiercely. There is a part of you that believes that closeness equals loss of self.",
      },
      {
        name: "The Conflict Avoider",
        description:
          "You do almost anything to keep the peace. You swallow your own needs rather than risk conflict. You are expert at smoothing things over, but you also carry a low-grade resentment for always being the one to yield.",
      },
      {
        name: "The Conflict Seeker",
        description:
          "You find yourself initiating fights or drama. You need intensity to feel alive. There is a part of you that believes conflict is proof of connection, that fighting is how you stay engaged.",
      },
    ],
  },

  "somatic-patterns": {
    template: `In your body, certain patterns show up repeatedly. These are not signs of weakness or brokenness—they are your nervous system's way of communicating with you. As you notice these patterns in your body, listen to what your soma is trying to teach you.`,
    examplePatterns: [
      {
        name: "The Held Breath",
        description:
          "You notice that you hold your breath when you are anxious, scared, or about to do something hard. Your body goes small and tight. Your chest closes.",
      },
      {
        name: "The Clenched Jaw",
        description:
          "You carry tension in your jaw and teeth. You may grind your teeth at night. You swallow words rather than speak them. Your jaw is the seat of power and authority in your body, and it is held tight.",
      },
      {
        name: "The Tight Shoulders",
        description:
          "Your shoulders are hunched up around your ears. You carry the weight of the world literally on your shoulders. You are braced for impact, even when there is no threat.",
      },
      {
        name: "The Collapsed Chest",
        description:
          "Your chest is small, closed, protected. Your heart center is guarded. There is a diminishment in your upper body as if you are trying to take up less space.",
      },
      {
        name: "The Disconnected Belly",
        description:
          "You are cut off from your gut feelings. You cannot access your intuition. Your belly is numb or tight. Your second brain is disconnected from your first brain.",
      },
    ],
  },

  "thought-patterns": {
    template: `In your thinking, certain patterns show up repeatedly. These are not truth—they are the stories your nervous system learned to tell to make sense of what happened to you. As you notice these patterns in your mind, remember that you can question them. You can look at evidence. You can choose different thoughts.`,
    examplePatterns: [
      {
        name: "Catastrophizing",
        description:
          "Your mind jumps to the worst possible outcome. You imagine disaster. You prepare for the catastrophe that may not come. Your mind is a threat-detection machine running on high alert.",
      },
      {
        name: "Mind Reading",
        description:
          "You assume you know what other people are thinking about you, and usually, it is something negative. You read rejection in neutral interactions. You anticipate judgment.",
      },
      {
        name: "All-or-Nothing",
        description:
          "Your thinking is black and white. People are all good or all bad. Situations are successes or failures. There is no middle ground, no nuance, no both/and.",
      },
      {
        name: "Should Statements",
        description:
          "Your mind is full of shoulds. You should be further along. You should be different. You should handle this better. Your mind is a tyrant of expectations.",
      },
      {
        name: "Rumination",
        description:
          "You get stuck in circular thinking, replaying conversations, analyzing interactions, looking for what you did wrong. Your mind chews on the past rather than inhabiting the present.",
      },
    ],
  },

  "behavioral-patterns": {
    template: `In your actions, certain patterns show up repeatedly. These are the things you find yourself doing, again and again, even when you know they are not serving you. As you notice these patterns, get curious: what are they protecting against? What do they help you avoid? What would become possible if you responded differently?`,
    examplePatterns: [
      {
        name: "Over-Functioning",
        description:
          "You take on too much. You say yes when you mean no. You manage, organize, control. You do for others what they could do for themselves. You are exhausted from the doing.",
      },
      {
        name: "Under-Functioning",
        description:
          "You do not step into your own power. You wait for permission. You qualify your ideas before speaking them. You stay small. You do not offer what you have because you do not believe it is worth offering.",
      },
      {
        name: "Numbing",
        description:
          "You use substances, distractions, or behaviors to not feel what you are feeling. Food, alcohol, shopping, work, social media—you have your way of going numb.",
      },
      {
        name: "Isolating",
        description:
          "You withdraw when things get hard. You pull away from the people who care about you. You sit with your pain alone, and you call it self-sufficiency.",
      },
      {
        name: "Performing",
        description:
          "You show up as whatever version of yourself you think is needed. You are acutely aware of the audience and you adjust your performance accordingly. You are never fully yourself in any room.",
      },
    ],
  },
};

// ============================================================================
// MAIN REPORT GENERATION FUNCTION
// ============================================================================

export function generateMirrorReport(
  userName: string,
  scoringResult: FullAssessmentResult,
  routingResult: RoutingOutput
): MirrorReport {
  // Get archetype data
  const primaryArchetypeName = scoringResult.primaryArchetype;
  const shadowArchetypeName = scoringResult.shadowArchetype;

  const primaryArchetype =
    ARCHETYPE_LIBRARY[primaryArchetypeName] ||
    ARCHETYPE_LIBRARY["the-silent-flame"];
  const shadowArchetype =
    SHADOW_ARCHETYPE_LIBRARY[primaryArchetypeName] ||
    SHADOW_ARCHETYPE_LIBRARY["the-silent-flame"];

  // Get top wounds
  const topWounds = scoringResult.primaryWounds
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const primaryWound = {
    name: topWounds[0]?.name || "Abandonment",
    description:
      WOUND_PATTERNS_LIBRARY[topWounds[0]?.name.toLowerCase().replace(/ /g, "-")]
        ?.description || "",
    howItMoves:
      WOUND_PATTERNS_LIBRARY[topWounds[0]?.name.toLowerCase().replace(/ /g, "-")]
        ?.howItMoves || "",
  };

  const secondaryWound = {
    name: topWounds[1]?.name || "Worthlessness",
    description:
      WOUND_PATTERNS_LIBRARY[topWounds[1]?.name.toLowerCase().replace(/ /g, "-")]
        ?.description || "",
    howItMoves:
      WOUND_PATTERNS_LIBRARY[topWounds[1]?.name.toLowerCase().replace(/ /g, "-")]
        ?.howItMoves || "",
  };

  const tertiaryWound = {
    name: topWounds[2]?.name || "Powerlessness",
    description:
      WOUND_PATTERNS_LIBRARY[topWounds[2]?.name.toLowerCase().replace(/ /g, "-")]
        ?.description || "",
    howItMoves:
      WOUND_PATTERNS_LIBRARY[topWounds[2]?.name.toLowerCase().replace(/ /g, "-")]
        ?.howItMoves || "",
  };

  // Build wound constellation narrative
  const woundConstellationNarrative = `These three wounds—${primaryWound.name}, ${secondaryWound.name}, and ${tertiaryWound.name}—form a constellation in your inner sky. They are not separate injuries. They are related. They speak to each other. They reinforce each other. Together, they create the particular shape of your struggle, and also the particular shape of your capacity. As you heal one, you shift the whole constellation. As you understand one, you begin to understand the others.`;

  // Get NS profile
  const nsProfileName = scoringResult.nervousSystemProfile.dominantState
    .toLowerCase()
    .replace(/ /g, "-");
  const nsProfile = NS_PROFILES_LIBRARY[nsProfileName] || NS_PROFILES_LIBRARY["ventral-vagal"];

  // Get phase information
  const phaseKey = routingResult.phase.toLowerCase().replace(/ /g, "-");
  const phaseData = PHASE_DESCRIPTIONS[phaseKey] || PHASE_DESCRIPTIONS["phase-1-awakening"];

  // Get pathway information
  const pathwayKey = routingResult.pathway.toLowerCase().replace(/ /g, "-");
  const pathwayData = PATHWAY_LIBRARY[pathwayKey] || PATHWAY_LIBRARY["reclamation"];

  // Get random opening and closing
  const openingInvocation = OPENING_INVOCATIONS[
    Math.floor(Math.random() * OPENING_INVOCATIONS.length)
  ].replace("{{name}}", userName);

  const closingBlessingTemplate =
    CLOSING_BLESSINGS[Math.floor(Math.random() * CLOSING_BLESSINGS.length)];
  const closingBlessing = closingBlessingTemplate.replace("{{name}}", userName);

  // Build mirror patterns
  const mirrorPatternNarrative = buildMirrorPatternNarrative(
    scoringResult.mirrorPatterns
  );

  // Create the report
  const report: MirrorReport = {
    generatedAt: new Date(),
    userName,

    openingInvocation,

    primaryArchetype,
    shadowArchetype,

    woundConstellation: {
      primary: primaryWound,
      secondary: secondaryWound,
      tertiary: tertiaryWound,
      constellation: woundConstellationNarrative,
    },

    mirrorPatterns: {
      patterns: scoringResult.mirrorPatterns.map((pattern) => ({
        name: pattern.name,
        description: getMirrorPatternDescription(pattern.name),
      })),
      narrative: mirrorPatternNarrative,
    },

    nsPortrait: {
      dominantState: scoringResult.nervousSystemProfile.dominantState,
      profile: nsProfile.profile,
      bodyWisdom: nsProfile.bodyWisdom,
      practices: nsProfile.practices,
    },

    phaseReport: {
      scoredPhase: scoringResult.phase,
      selfPlacedPhase: routingResult.phase,
      alignment: buildPhaseAlignment(scoringResult.phase, routingResult.phase),
      phaseDescription: phaseData.description,
      phaseInvitation: phaseData.invitation,
    },

    pathway: {
      name: pathwayData.description.split("\n")[0],
      description: pathwayData.description,
      firstSteps: pathwayData.firstSteps,
      modulePreview: pathwayData.modulePreview,
    },

    closingBlessing,

    spectrumProfile: {
      shadow: scoringResult.spectrumScores.shadow,
      threshold: scoringResult.spectrumScores.threshold,
      gift: scoringResult.spectrumScores.gift,
    },
    siProportion: scoringResult.siProportion,
    assessmentId: scoringResult.assessmentId,
  };

  return report;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildMirrorPatternNarrative(
  patterns: Array<{ name: string; intensity: number }>
): string {
  const topPatterns = patterns.slice(0, 3);
  const patternNames = topPatterns.map((p) => p.name).join(", ");

  return `In your life, you see yourself reflected most clearly in these patterns: ${patternNames}. These are not failures. These are the ways your nervous system has learned to navigate the world. They are wisdom, even when they don't feel that way. As you move through your pathway, you will begin to understand what these patterns have been trying to protect you against, and what becomes possible when you can choose differently.`;
}

function getMirrorPatternDescription(patternName: string): string {
  for (const template of Object.values(MIRROR_PATTERN_TEMPLATES)) {
    for (const pattern of template.examplePatterns) {
      if (pattern.name.toLowerCase() === patternName.toLowerCase()) {
        return pattern.description;
      }
    }
  }
  return `A pattern of ${patternName} that shows up in your life in ways both obvious and subtle.`;
}

function buildPhaseAlignment(
  scoredPhase: string,
  selfPlacedPhase: string
): string {
  if (scoredPhase === selfPlacedPhase) {
    return `Your own sense of where you are aligns with what the assessment shows. This alignment suggests you have good awareness of your own process. Trust that awareness.`;
  } else {
    return `Your self-assessment and the assessment's scoring show a slight difference. This is valuable information. It may be that you are ahead of where you think you are, or that you are working with material that requires more time. Either way, this mismatch is worth noticing and honoring.`;
  }
}

export type {
  MirrorReport,
  FullAssessmentResult,
  RoutingOutput,
  ArchetypePortrait,
  ShadowArchetype,
  WoundConstellation,
  MirrorPatterns,
  NervousSystemPortrait,
  PhaseReport,
  PathwayDescription,
  SpectrumProfile,
};
