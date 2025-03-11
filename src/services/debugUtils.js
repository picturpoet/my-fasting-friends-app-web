// Debug utility for checking collection structures
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

// Function to list all documents in a collection
export const listCollectionDocuments = async (collectionName) => {
  try {
    console.log(`Listing documents in collection: ${collectionName}`);
    const querySnapshot = await getDocs(collection(db, collectionName));
    
    if (querySnapshot.empty) {
      console.log(`No documents found in ${collectionName}`);
      return [];
    }
    
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    console.log(`Found ${documents.length} documents in ${collectionName}`);
    console.log(JSON.stringify(documents, null, 2));
    return documents;
  } catch (error) {
    console.error(`Error listing documents in ${collectionName}:`, error);
    throw error;
  }
};

// Function to get a specific document
export const getDocumentById = async (collectionName, documentId) => {
  try {
    console.log(`Getting document ${documentId} from collection ${collectionName}`);
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log(`Document ${documentId} not found in ${collectionName}`);
      return null;
    }
    
    const documentData = {
      id: docSnap.id,
      data: docSnap.data()
    };
    
    console.log(`Document data:`, JSON.stringify(documentData, null, 2));
    return documentData;
  } catch (error) {
    console.error(`Error getting document ${documentId} from ${collectionName}:`, error);
    throw error;
  }
};