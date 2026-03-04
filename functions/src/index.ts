import {setGlobalOptions} from "firebase-functions";
import {initializeApp} from "firebase-admin/app";

setGlobalOptions({maxInstances: 10});
initializeApp();
