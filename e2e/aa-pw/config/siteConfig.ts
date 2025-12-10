export type Stage = 'dev' | 'test' | 'uat' | 'prod';
export type Site = 'npd' | 'gpg';

export interface TestDatum {
  PART_NUMBER: string;
  VIN: string;
  QUESTION: string;
}

export interface SiteStageConfig {
  baseURL?: string; // optional override; default uses https://${site}.${stage}.autobestdevops.com
  data: TestDatum[];
}

export const siteConfig: Record<Stage, Record<Site, SiteStageConfig>> = {
  dev: {
    npd: {
      data: [
        { PART_NUMBER: '15200-EN20A', VIN: 'JN8AZ2KR0ET350093', QUESTION: 'is it fit my car?' },
      ],
    },
    gpg: {
      data: [
        { PART_NUMBER: '42617771', VIN: 'KL77L6E29RC093225', QUESTION: 'Steering Wheel' },
        { PART_NUMBER: '98082322', VIN: '54DEEJ1D8RSR02424', QUESTION: 'What about this part number: 98082322 ,is it fit my car?' },
      ],
    },
  },
  test: {
    npd: {
      data: [
        { PART_NUMBER: '15200-EN20A', VIN: 'JN8AZ2KR0ET350093', QUESTION: 'is it fit my car?' },
      ],
    },
    gpg: {
      data: [
        { PART_NUMBER: '42617771', VIN: 'KL77L6E29RC093225', QUESTION: 'Steering Wheel' },
        { PART_NUMBER: '98082322', VIN: '54DEEJ1D8RSR02424', QUESTION: 'What about this part number: 98082322 ,is it fit my car?' },
      ],
    },
  },
  uat: {
    npd: {
      data: [
        { PART_NUMBER: '15200-EN20A', VIN: 'JN8AZ2KR0ET350093', QUESTION: 'is it fit my car?' },
      ],
    },
    gpg: {
      data: [
        { PART_NUMBER: '42617771', VIN: 'KL77L6E29RC093225', QUESTION: 'Steering Wheel' },
        { PART_NUMBER: '98082322', VIN: '54DEEJ1D8RSR02424', QUESTION: 'What about this part number: 98082322 ,is it fit my car?' },
      ],
    },
  },
  prod: {
    npd: {
      data: [
        { PART_NUMBER: '15200-EN21A', VIN: 'LN0AZ2KR0ET350093', QUESTION: 'is it fit my car?' },
        { PART_NUMBER: '98082322', VIN: '54DEEJ1D8RSR02424', QUESTION: 'What about this part number: 98082322 ,is it fit my car?' },
      ],
    },
    gpg: {
      data: [
        { PART_NUMBER: '42617771', VIN: 'KL77L6E29RC093225', QUESTION: 'Steering Wheel' },
      ],
    },
  },
};
