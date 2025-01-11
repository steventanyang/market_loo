export interface Outcome {
  name: string;
  probability: number;
  buyPrice: number;
  sellPrice: number;
  volume: string;
}

export interface Market {
  id: string;
  title: string;
  icon: string;
  volume: string;
  endDate: string;
  outcomes: Outcome[];
}
