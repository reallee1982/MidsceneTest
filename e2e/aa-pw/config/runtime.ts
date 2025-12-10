import { siteConfig, type Stage, type Site, type SiteStageConfig } from './siteConfig';

export interface RuntimeConfig extends SiteStageConfig {
  stage: Stage;
  site: Site;
  baseURL: string;
}

export function resolveStageSiteFromProject(projectName: string): { stage: Stage; site: Site } {
  const [site, stage] = projectName.split('-') as [Site | undefined, Stage | undefined];
  if (!site || !stage) {
    throw new Error(`Project name must be in <site>-<stage> format, got "${projectName}"`);
  }
  return { site, stage };
}

export function getRuntimeConfigFromProject(projectName: string): RuntimeConfig {
  const { site, stage } = resolveStageSiteFromProject(projectName);
  const config = siteConfig[stage]?.[site];
  if (!config) {
    throw new Error(`No config for stage=${stage} site=${site}`);
  }
  const baseURL = config.baseURL ?? `https://${site}.${stage}.autobestdevops.com`;
  return { stage, site, baseURL, data: config.data };
}
