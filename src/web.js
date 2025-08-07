import { compile } from 'html-to-text';
import { RecursiveUrlLoader } from '@langchain/community/document_loaders/web/recursive_url';

const compiledConvert = compile({ wordwrap: 130 }); // returns (text: string) => string;

const loader = new RecursiveUrlLoader(
  'https://ir.mi.com/zh-hant/news-events/event-calendar',
  {
    extractor: compiledConvert,
    maxDepth: 1,
  }
);
