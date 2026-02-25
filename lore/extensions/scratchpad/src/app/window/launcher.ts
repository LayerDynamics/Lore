import open from 'open';

export async function launchBrowser(url: string): Promise<void> {
  await open(url);
}
