export interface NasaEonetEventInterface {
    id: string;
    title: string;
    description: string;
    link: string;
    closed: unknown;
    categories: {id: string; title: string;}[];
    sources: {id: string; url: string;}[];
    geometry: {
        magnitudeValue: number;
        magnitudeUnit: string;
        date: Date;
        type: string;
        coordinates: number[]
    }[];
}