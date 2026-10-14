import solc from 'solc';
import { createHash } from 'node:crypto';
import { canonicalJson } from '@red-cup-engineering/json-services-section';

/** Compile a closed standard-JSON source set. No filesystem import callback,
 * network, contract deployment, example execution or test runner is supplied. */
export function compileSolidity(input) {
  if (input?.language !== 'Solidity' || !input.sources || Array.isArray(input.sources))
    throw new TypeError('a closed Solidity standard-JSON input is required');
  const entries = Object.entries(input.sources);
  if (!entries.length || entries.length > 256 || entries.some(([path, source]) =>
    !path || path.split('/').some(part => !part || part === '.' || part === '..')
    || /[\\\0]/u.test(path) || typeof source?.content !== 'string' || Object.keys(source).some(key => key !== 'content')))
    throw new TypeError('Solidity sources must be canonical paths with literal content');
  const text = canonicalJson(input);
  if (Buffer.byteLength(text) > 8 * 1024 * 1024) throw new RangeError('Solidity compiler input exceeds 8 MiB');
  const version = solc.version();
  if (version.split('+')[0] !== '0.8.28') throw new Error('the selected compiler differs from solc 0.8.28');
  const output = JSON.parse(solc.compile(text));
  const errors = (output.errors ?? []).filter(item => item.severity === 'error');
  if (errors.length) throw new Error('Solidity compilation refused: ' + errors.map(item => item.formattedMessage ?? item.message).join('\n'));
  return { type: 'SolidityCompilation', version: 1, compiler: { name: 'solc', version },
    inputSha256: createHash('sha256').update(text).digest('hex'), output };
}
