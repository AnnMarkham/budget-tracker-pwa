let db;
//establish a connection t IndexedDB called 'budget' and set it to version 1
const request = indexedDB.open('budget', 1);

//this event will emit if the database version changes
request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore('new_budget', { autoIncrement: true });
};

request.onsuccess = function (event) {
  // when db is successfully created with its object store (from onupgradedneeded event above) or an established a connection, save reference to db in global variable
  db = event.target.result;
  //check if app is online. if yes, run uploadBudget() function to send all data to api
  if (navigator.onLine) {
    uploadBudget()
  }
};
 
request.onerror = function (event) {
  console.log(event.target.errorCode);
};

//If user tries to add or subtract a budget transaction without internet connection, the data will be stored in new-budget object store
function saveRecord(record) {
  // open a new transaction with the database with read and write permissions   
  const transaction = db.transaction(['new_budget'], 'readwrite');

  //access the object store for 'new-budget'
  const budgetObjectStore = transaction.objectStore('new_budget');

  //add record to your store with add method 
  budgetObjectStore.add(record);
};

function uploadBudget() {
  //open a transaction on your database
  const transaction = db.transaction(['new_budget'], 'readwrite');
  //access your object store
  const budgetObjectStore = transaction.objectStore('new_budget');
  //get all records for store and set t a variable named getAll
  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function () {
    //if there was data in the object store, send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
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
          //open one more transaction
          const transaction = db.transaction(['new_budget'], 'readwrite');
          //access the new_budget object store
          const budgetObjectStore = transaction.objectStore('new_budget');
          //clear items in the store
          budgetObjectStore.clear();
        })
        .catch(err => {
          console.log(err)
        });
    }
  };
}

//listen for the app coming back online (when it does, run uploadBudget() to add data to budget database)
window.addEventListener('online', uploadBudget);