import path from 'path';
import { readSvgDirectory } from '@lucide/helpers';

async function getIconMetaData(iconDirectory, ignoreMissing = false) {
  const iconJsons = await readSvgDirectory(iconDirectory, '.json');
  const aliasesEntries = await Promise.all(
    iconJsons.map(async (jsonFile) => {
      try {
        /** eslint-disable */
        const file = await import(path.join(iconDirectory, jsonFile), { with: { type: 'json' } });
        return [path.basename(jsonFile, '.json'), file.default];
      } catch (error) {
        if (!ignoreMissing) {
          throw error;
        }
      }
      return null;
    }),
  );

  return Object.fromEntries(aliasesEntries.filter(entry => entry !== null));
}

export default getIconMetaData;
