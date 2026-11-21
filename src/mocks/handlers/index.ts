import { Router } from "./http";
import { registerCoaHandlers, registerJournalHandlers } from "./journal";
import { registerOverviewHandlers } from "./overview";
import { registerRecordHandlers } from "./records";
import { registerUserHandlers } from "./users";

/** Specific routes first; the generic "<module>/<tab>" record routes last. */
export const router = new Router();
registerOverviewHandlers(router);
registerJournalHandlers(router);
registerCoaHandlers(router);
registerUserHandlers(router);
registerRecordHandlers(router);
