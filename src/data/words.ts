import type { Conjugation } from './conjugations';
import type { Rarity } from './rarity';

export type WordType = 'Noun' | 'Verb' | 'Adjective';

export type Word = {
  id: string;
  word: string;
  meaning: string;
  type: WordType;
  gender?: 'M' | 'F';
  rarity: Rarity;
  example: string;
  exampleMeaning: string;
  /** Verbs only. Not stored yet, so verb cards fall back to `regularConjugation`. */
  conjugation?: Conjugation;
};

/** Every word that can come out of a capsule. */
export const Words: Word[] = [
  { id: 'mariposa', word: 'la mariposa', meaning: 'the butterfly', type: 'Noun', gender: 'F', rarity: 'ultraRare', example: 'La mariposa vuela sobre las flores.', exampleMeaning: 'The butterfly flies over the flowers.' },
  { id: 'dragon', word: 'el dragón', meaning: 'the dragon', type: 'Noun', gender: 'M', rarity: 'ultraRare', example: 'El dragón duerme en la montaña.', exampleMeaning: 'The dragon sleeps on the mountain.' },
  { id: 'gato', word: 'el gato', meaning: 'the cat', type: 'Noun', gender: 'M', rarity: 'superRare', example: 'El gato duerme en el sofá.', exampleMeaning: 'The cat is sleeping on the sofa.' },
  { id: 'bailar', word: 'bailar', meaning: 'to dance', type: 'Verb', rarity: 'superRare', example: 'Me gusta bailar los sábados.', exampleMeaning: 'I like to dance on Saturdays.' },
  { id: 'estrella', word: 'la estrella', meaning: 'the star', type: 'Noun', gender: 'F', rarity: 'superRare', example: 'Veo una estrella en el cielo.', exampleMeaning: 'I see a star in the sky.' },
  { id: 'arbol', word: 'el árbol', meaning: 'the tree', type: 'Noun', gender: 'M', rarity: 'rare', example: 'El árbol es muy alto.', exampleMeaning: 'The tree is very tall.' },
  { id: 'feliz', word: 'feliz', meaning: 'happy', type: 'Adjective', rarity: 'rare', example: 'Hoy estoy muy feliz.', exampleMeaning: 'Today I am very happy.' },
  { id: 'cielo', word: 'el cielo', meaning: 'the sky', type: 'Noun', gender: 'M', rarity: 'rare', example: 'El cielo está azul.', exampleMeaning: 'The sky is blue.' },
  { id: 'luna', word: 'la luna', meaning: 'the moon', type: 'Noun', gender: 'F', rarity: 'rare', example: 'La luna sale de noche.', exampleMeaning: 'The moon comes out at night.' },
  { id: 'libro', word: 'el libro', meaning: 'the book', type: 'Noun', gender: 'M', rarity: 'uncommon', example: 'Leo un libro cada semana.', exampleMeaning: 'I read a book every week.' },
  { id: 'rojo', word: 'rojo', meaning: 'red', type: 'Adjective', rarity: 'uncommon', example: 'Mi coche es rojo.', exampleMeaning: 'My car is red.' },
  { id: 'playa', word: 'la playa', meaning: 'the beach', type: 'Noun', gender: 'F', rarity: 'uncommon', example: 'Vamos a la playa en verano.', exampleMeaning: 'We go to the beach in summer.' },
  { id: 'sol', word: 'el sol', meaning: 'the sun', type: 'Noun', gender: 'M', rarity: 'uncommon', example: 'El sol brilla mucho hoy.', exampleMeaning: 'The sun is shining a lot today.' },
  { id: 'dulce', word: 'dulce', meaning: 'sweet', type: 'Adjective', rarity: 'uncommon', example: 'El pastel es muy dulce.', exampleMeaning: 'The cake is very sweet.' },
  { id: 'manzana', word: 'la manzana', meaning: 'the apple', type: 'Noun', gender: 'F', rarity: 'common', example: 'Como una manzana cada día.', exampleMeaning: 'I eat an apple every day.' },
  { id: 'casa', word: 'la casa', meaning: 'the house', type: 'Noun', gender: 'F', rarity: 'common', example: 'Mi casa es pequeña.', exampleMeaning: 'My house is small.' },
  { id: 'perro', word: 'el perro', meaning: 'the dog', type: 'Noun', gender: 'M', rarity: 'common', example: 'El perro juega en el parque.', exampleMeaning: 'The dog plays in the park.' },
  { id: 'correr', word: 'correr', meaning: 'to run', type: 'Verb', rarity: 'common', example: 'Me gusta correr por la mañana.', exampleMeaning: 'I like to run in the morning.' },
  { id: 'hablar', word: 'hablar', meaning: 'to speak', type: 'Verb', rarity: 'common', example: 'Quiero hablar español.', exampleMeaning: 'I want to speak Spanish.' },
  { id: 'comer', word: 'comer', meaning: 'to eat', type: 'Verb', rarity: 'common', example: 'Vamos a comer a las dos.', exampleMeaning: "We're going to eat at two." },
  { id: 'nadar', word: 'nadar', meaning: 'to swim', type: 'Verb', rarity: 'common', example: 'Los niños saben nadar.', exampleMeaning: 'The children know how to swim.' },
  { id: 'rapido', word: 'rápido', meaning: 'fast', type: 'Adjective', rarity: 'common', example: 'El tren es muy rápido.', exampleMeaning: 'The train is very fast.' },
  { id: 'grande', word: 'grande', meaning: 'big', type: 'Adjective', rarity: 'common', example: 'La ciudad es grande.', exampleMeaning: 'The city is big.' },
];

/** The words a new learner starts with. */
export const StarterWordIds = [
  'mariposa', 'gato', 'bailar', 'arbol', 'feliz', 'cielo', 'libro', 'rojo',
  'playa', 'manzana', 'casa', 'correr', 'hablar', 'comer', 'rapido',
];

const byId = new Map(Words.map((w) => [w.id, w]));

export function getWord(id: string): Word | undefined {
  return byId.get(id);
}

/** "el gato" → "gato", for compact lists. */
export function bareWord(word: string) {
  return word.replace(/^(el|la|los|las) /i, '');
}
