export type SceneId = 'hospital'|'corridor'|'living'|'bedroom'|'assessment'|'penthouse'|'past_armoury'|'past_cell'|'past_rescue'|'study'|'penthouse_night'|'rift';
export type Perspective = 'objective'|'subjective';
export type EndingId = 'voice'|'stay'|'mask';
export type CharacterId = 'castian'|'titus'|'doctor'|'thalamas'|'castian-armour'|'titus-armour'|'thalamas-armour';
export interface Fragment {id:string;title:string;foundAt:string;anchor:string;objective:string;subjective:string;source:string}
export interface Hotspot {id:string;name:string;x:number;y:number;objective:string[];subjective:string[];fragment?:string;effect?:boolean;dialogue?:string;puzzle?:PuzzleId}
export interface StoryScene {id:SceneId;title:string;subtitle:string;chapter:string;intro:string[];objects:Hotspot[];goal:string;time:string;nextLabel:string;actor:CharacterId|'none';era:'modern'|'past'|'memory';requiredPuzzles:PuzzleId[]}
export interface Choice {label:string;response:string;flag?:string;ending?:EndingId}
export interface DialogueNode {speaker:string;text:string;choices?:Choice[];condition?:'allFragments'|'preludeComplete';ifFlag?:string;unlessFlag?:string}
export interface Story {title:string;subtitle:string;version:number;fragments:Fragment[];scenes:StoryScene[];dialogues:Record<string,DialogueNode[]>}
export interface Settings {audio:boolean;reducedEffects:boolean;textSize:'normal'|'large'}
export interface TranscriptLine {speaker:string;text:string}
export interface GameState {
 version:3;scene:SceneId;perspective:Perspective;visited:SceneId[];fragments:string[];inspected:string[];talked:string[];flags:string[];
 reconstruction:(string|null)[];reconstructed:boolean;ending:EndingId|null;settings:Settings;savedAt:number|null;
 decisions:Record<string,string>;transcript:TranscriptLine[];puzzles:Record<PuzzleId,PuzzleProgress>;
}

export type PuzzleId='cogitator'|'laptop'|'phone'|'timeline';
export interface PuzzleProgress {solved:boolean;values:number[];text:string;evidence:string[];attempts:number}
