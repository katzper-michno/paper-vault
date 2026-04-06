import axios from 'axios';
import { Paper } from '../types';

const generateLink = async (paper: Paper): Promise<string | undefined> => {
  if (!paper.doi) return undefined;

  const shUrl = `https://sci-hub.pl/${paper.doi}`;

  try {
    const res = await axios(shUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const rawData = res.data as string;
    return (rawData.includes('application/pdf')) ? shUrl : undefined;
  } catch (err: any) {
    return undefined;
  }
};

export const SciHubClient = {
  generateLink
};
