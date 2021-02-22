// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'budget' and set it to version 1
const request = indexedDB.open('budget', 1);

// this event will emit if the database version changes 
request.onupgradeneeded = function (event) {
    // save a reference to the database 
    const db = event.target.result;
 // create an object store (table) called `new_data`, set it to have an auto incrementing
    db.createObjectStore('new_data', { autoIncrement: true });
};

request.onsuccess = function (event) {
     // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run uploadTransaction() function to send all local db data to api
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function (event) {
    // log error here
    console.log(event.target.errorCode);
};

// runs when theres no internet connection 
function saveRecord(record) {
     // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_data'], 'readwrite');

    // access the object store for `new_data`
    const newDataObjectStore = transaction.objectStore('new_data');

    // add record to your store with add method
    newDataObjectStore.add(record);
}

function uploadTransaction() {
    // open a transaction on your db
    const transaction = db.transaction(['new_data'], 'readwrite');

    // access your object store
    const newDataObjectStore = transaction.objectStore('new_data');

    // get all records from store and set to a variable
    const getAll = newDataObjectStore.getAll();

    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function () {

        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(['new_data'], 'readwrite');
                    // access the new_data object store
                    const newDataObjectStore = transaction.objectStore('new_data');
                    // clear all items in your store
                    newDataObjectStore.clear();

                    alert('All saved transactions has been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);