// id-generator.ts
export const ID_GENERATOR = Symbol('ID_GENERATOR');

export interface IdGenerator {
    newId(): string;
}