import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from '@xenova/transformers';

// 解决 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const extractor = await pipeline(
    'image-feature-extraction',
    'Xenova/clip-vit-base-patch16'
  );

  const imagePath1 = path.join(__dirname, 'test.png');
  const imagePath2 = path.join(__dirname, 'image', 'icon-05.png');

  const embedding1 = await extractor(imagePath1, {
    pooling: 'mean',
    normalize: true,
  });
  const embedding2 = await extractor(imagePath2, {
    pooling: 'mean',
    normalize: true,
  });

  function cosineSimilarity(a, b) {
    let dot = 0,
      normA = 0,
      normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  const similarity = cosineSimilarity(embedding1.data, embedding2.data);
  console.log('图片相似度:', similarity);
}

main();
