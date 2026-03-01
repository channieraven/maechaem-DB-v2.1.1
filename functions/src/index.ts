import {setGlobalOptions} from "firebase-functions";
import {onDocumentCreated, onDocumentDeleted} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";

setGlobalOptions({ maxInstances: 10 });
initializeApp();

const db = getFirestore();

type ExtensionUserDocument = {
	uid?: string;
	email?: string;
	displayName?: string;
	creationTime?: string;
};

type ProfileRole = "pending" | "admin";

function getDefaultFullname(userId: string, userData?: ExtensionUserDocument): string {
	const displayName = userData?.displayName?.trim();
	if (displayName) {
		return displayName;
	}

	const email = userData?.email?.trim();
	if (email) {
		return email.split("@")[0];
	}

	return userId;
}

function buildProfileDocument(
	userId: string,
	userData: ExtensionUserDocument | undefined,
	role: ProfileRole,
	approved: boolean,
): Record<string, unknown> {
	return {
		id: userId,
		email: userData?.email ?? "",
		fullname: getDefaultFullname(userId, userData),
		position: "-",
		organization: "-",
		role,
		approved,
		created_at: userData?.creationTime ?? new Date().toISOString(),
	};
}

export const syncProfileFromExtensionUser = onDocumentCreated(
	"users/{userId}",
	async (event) => {
		const userId = event.params.userId;
		const userData = event.data?.data() as ExtensionUserDocument | undefined;
		const profileRef = db.collection("profiles").doc(userId);

		await db.runTransaction(async (transaction) => {
			const profileSnapshot = await transaction.get(profileRef);
			if (profileSnapshot.exists) {
				return;
			}

			const firstProfileQuery = db.collection("profiles").limit(1);
			const firstProfileSnapshot = await transaction.get(firstProfileQuery);
			const isFirstUser = firstProfileSnapshot.empty;
			const role: ProfileRole = isFirstUser ? "admin" : "pending";
			const approved = isFirstUser;

			transaction.set(
				profileRef,
				buildProfileDocument(userId, userData, role, approved),
			);
		});

		logger.info("Synced profile from extension user document", {
			userId,
			sourceCollection: "users",
			targetCollection: "profiles",
		});
	},
);

export const deleteProfileForRemovedExtensionUser = onDocumentDeleted(
	"users/{userId}",
	async (event) => {
		const userId = event.params.userId;
		const profileRef = db.collection("profiles").doc(userId);
		const profileSnapshot = await profileRef.get();

		if (!profileSnapshot.exists) {
			return;
		}

		await profileRef.delete();

		logger.info("Deleted profile after extension user removal", {
			userId,
			sourceCollection: "users",
			targetCollection: "profiles",
		});
	},
);
