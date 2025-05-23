import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { TencentHunyuanEmbeddings } from '@langchain/community/embeddings/tencent_hunyuan';
import 'dotenv/config';
import { HumanMessage } from '@langchain/core/messages';

const messages = [new HumanMessage('介绍你自己')];

const hunyuanEmbedding = new TencentHunyuanEmbeddings({
  model: 'hunyuan-embedding',
  streaming: false,
  tencentSecretId: process.env.HUNYUAN_ID,
  tencentSecretKey: process.env.HUNYUAN_KEY,
});

// hunyuanLite.invoke(messages).then(docs => {
//   console.log(docs);
//   process.exit(0);
// });
// chat.invoke(messages).then(docs => {
//   console.log(docs);
//   process.exit(0);
// });
MemoryVectorStore.fromTexts(
  [
    '建筑物由砖块建成',
    '建筑物由木材建成',
    '建筑物由石头建成',
    '汽车由金属制成',
    '汽车由塑料制成',
    '线粒体是细胞的动力工厂',
    '线粒体由脂质构成',
  ],
  [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }, { id: 7 }],
  hunyuanEmbedding
).then(res => {
  res
    .asRetriever(5)
    .invoke('汽车由什么制成')
    .then(docs => {
      console.log(docs);
      process.exit(0);
    });
});
