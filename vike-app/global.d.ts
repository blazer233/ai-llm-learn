import type { todoModel } from './database/orm';

declare global {
  namespace Vike {
    interface PageContext {
      todoModel: typeof todoModel;
    }
  }
}
