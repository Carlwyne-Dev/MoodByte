import { useState, useEffect } from 'react';

const DB_NAME = 'MoodByteStudyDB';
const STORE_NAME = 'files';

export function useFileLibrary() {
  const [files, setFiles] = useState([]);
  const [db, setDb] = useState(null);

  useEffect(() => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (e) => {
      const database = e.target.result;
      setDb(database);
      loadFiles(database);
    };
  }, []);

  const loadFiles = (database) => {
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      // Store just metadata in state to avoid massive memory usage
      setFiles(request.result.map(f => ({ 
        id: f.id, 
        name: f.name, 
        type: f.type, 
        size: f.size 
      })));
    };
  };

  const saveFile = (file) => {
    if (!db) return;
    const newFile = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      size: file.size,
      blob: file // The actual File object (which is a Blob)
    };
    
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.add(newFile);
    
    transaction.oncomplete = () => loadFiles(db);
  };

  const getFileBlob = (id) => {
    return new Promise((resolve, reject) => {
      if (!db) return reject('No DB connection');
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result?.blob);
      request.onerror = () => reject(request.error);
    });
  };

  const deleteFile = (id) => {
    if (!db) return;
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(id);
    
    transaction.oncomplete = () => loadFiles(db);
  };

  return { files, saveFile, getFileBlob, deleteFile };
}
