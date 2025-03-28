import { basename } from 'path';
import { parseSync } from 'svgson';
import { generateHashedKey, readSvg, hasDuplicatedChildren } from '@lucide/helpers';

function checkForDuplicatedChildren(
  contents,
  name,
  renderUniqueKey = false,
) {
  if (hasDuplicatedChildren(contents.children)) {
    throw new Error(`Duplicated children in ${name}.svg`);
  }

  contents.children.forEach((child) => {
    checkForDuplicatedChildren(child, name, renderUniqueKey)
  });
}

function generateUniqueKeys(contents) {
  return contents.children.map((child) => {
    child.attributes.key = generateHashedKey(child);
    child.children = generateUniqueKeys(child);

    return child;
  });
}

/**
 * Build an object in the format: `{ <name>: <contents> }`.
 * @param {string[]} svgFiles - A list of filenames.
 * @param {Function} getSvg - A function that returns the contents of an SVG file given a filename.
 * @returns {Object}
 */
export default async function generateIconObject(
  svgFiles,
  iconsDirectory,
  renderUniqueKey = false,
) {
  const svgsContentPromises = svgFiles.map(async (svgFile) => {
    const name = basename(svgFile, '.svg');
    const svg = await readSvg(svgFile, iconsDirectory);
    const contents = parseSync(svg);

    if (!(contents.children && contents.children.length)) {
      throw new Error(`${name}.svg has no children!`);
    }

    checkForDuplicatedChildren(contents, name, renderUniqueKey);

    if (renderUniqueKey) {
      contents.children = generateUniqueKeys(contents);
    }

    return { name, contents };
  });

  const svgsContents = await Promise.all(svgsContentPromises);

  return svgsContents.reduce((icons, icon) => {
    icons[icon.name] = icon.contents;
    return icons;
  }, {});
}
