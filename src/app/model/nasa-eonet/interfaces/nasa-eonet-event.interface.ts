export interface NasaEonetEventInterface {
    id: string;
    title: string;
    description: string;
    link: string;
    closed: unknown;
    categories: {id: string; title: string;}[];
    sources: {id: string; url: string;}[];
    geometry: NasaNatureEventInterface[];
}

export interface NasaNatureEventInterface {
    title: string;              // From NasaEonetEventInterface
    description: string;        // From NasaEonetEventInterface
    url: string;                // From NasaEonetEventInterface
    magnitudeValue: number;
    magnitudeUnit: string;
    date: Date;
    type: string;
    coordinates: number[]
}