define([
  'knockout',
  'signals',
  'ofsc-connector',
  './models/activity-model',
  './models/activity-service',
  './models/persistent-storage',
  './constants',
  'text!./app.html',
  './i18n',

  // non-referenced:
  'css!./app',
  './activity-block-component/activity-block-component'
], (ko,
  Signal,
  OfscConnector,
  ActivityModel,
  ActivityService,
  PersistentStorage,
  constants,
  appTemplate,
  i18n) => {

  const STORAGE_PREFIX = 'meter_';
  const STORAGE_KEY_ACTIVITY_CHANGES = STORAGE_PREFIX + 'activityChanges';
  const STORAGE_KEY_ATTRIBUTE_DESCRIPTION = STORAGE_PREFIX + 'attributeDescription';
  const STORAGE_KEY_CHANGES_APPLIED = STORAGE_PREFIX + 'isChangesApplied';
  const STORAGE_KEY_RESOURCE_ID = STORAGE_PREFIX + 'resourceId';

  class PluginApp {
    /**
     * @param {Element} domElement
     */
    constructor(domElement) {
      console.log("APP.JS CONSTRUCTOR INICIO");
      console.log("APP.JS CONSTRUCTOR PASO 1");
      this.domElement = domElement;
      this.ofscConnector = new OfscConnector();

      this.ofscConnector.debugMessageReceivedSignal.add((data) => {
        console.info('--> ACTIVITY SEARCH PLUGIN: ', data);
      });

      this.ofscConnector.debugMessageSentSignal.add((data) => {
        console.info('<-- ACTIVITY SEARCH PLUGIN: ', data);
      });

      this.ofscConnector.debugIncorrectMessageReceivedSignal.add((error, data) => {
        console.error('--> ACTIVITY SEARCH PLUGIN: incorrect message: ', error, data);
      });

      this.activityService = new ActivityService();

      this.attributeDescription = this._loadAttributeDescription();
      this.activityDictionary = {};
      this.activityViewModelList = {
        list: [],
        lastCompletedNumber: null
      };
      console.log("APP.JS CONSTRUCTOR PASO 1.1", this.activityViewModelList);
      this.resourceId = null;

      this.isProcessing = ko.observable(false);
      this.isLoaded = ko.observable(false);

      this.searchQuery = ko.observable('');

      this.searchQueryDebounced = ko.pureComputed(() => {
        console.log("APP.JS CONSTRUCTOR PASO 2");
        return this.searchQuery();
      }).extend({
        rateLimit: 250
      });

      this.searchQueryIsEmpty = ko.pureComputed(() => {
        console.log("APP.JS CONSTRUCTOR PASO 3");
        return this.searchQuery().length < constants.MIN_SEARCH_REQUEST_LENGTH;
      });

      this.foundActivities = ko.pureComputed(() => {
        console.log("APP.JS CONSTRUCTOR PASO 4");
        if (this.searchQueryIsEmpty()) {
          console.log("APP.JS CONSTRUCTOR PASO 5");
          return [];
        }
        return this.searchActivity(this.searchQueryDebounced());
      });

      /**
       * @return {Array}
       * @type {void|*}
       */
      this.searchResults = ko.pureComputed(() => {
        console.log("APP.JS CONSTRUCTOR PASO 6");
        //console.log('Solciita el litado de searchResults');
        let foundActivities = this.foundActivities();

        let entriesNumber = 0;

        return foundActivities.reduce((accumulator, normalizedActivity) => {
          console.log("APP.JS CONSTRUCTOR PASO 7");
          ++entriesNumber;
          if (entriesNumber > constants.MAX_SEARCH_ENTRIES_NUMBER) {
            console.log("APP.JS CONSTRUCTOR PASO 8");
            return accumulator;
          }

          if (entriesNumber == 1) {
            console.log("APP.JS CONSTRUCTOR PASO 9");
            normalizedActivity.activity.toggleEditor = true;
          }
          console.log("APP.JS CONSTRUCTOR PASO 10");
          console.log("APP.JS CONSTRUCTOR PASO 11", normalizedActivity.activity);
          accumulator.push(normalizedActivity.activity);
          return accumulator;
        }, []);
      });

      this.notShownSearchResultsNumber = ko.pureComputed(() => {
        console.log("APP.JS CONSTRUCTOR PASO 12");
        console.log("APP.JS CONSTRUCTOR PASO 13", this.foundActivities().length);
        console.log("APP.JS CONSTRUCTOR PASO 14", constants.MAX_SEARCH_ENTRIES_NUMBER);
        return Math.max(0, this.foundActivities().length - constants.MAX_SEARCH_ENTRIES_NUMBER);
      });

      this.notShownSearchResults = ko.pureComputed(() => {
        console.log("APP.JS CONSTRUCTOR PASO 15");
        console.log("APP.JS CONSTRUCTOR PASO 16", this.notShownSearchResultsNumber());
        if (!this.notShownSearchResultsNumber()) {
          console.log("APP.JS CONSTRUCTOR PASO 17");
          return '';
        }
        console.log("APP.JS CONSTRUCTOR PASO 18", this.notShownSearchResultsNumber());
        return this.i18n('search-not-shown-results-text').replace('#NUMBER#', this.notShownSearchResultsNumber());
      });

      this.isScrolled = ko.observable(false);

      let updateScrollPosition = (e) => {
        console.log("APP.JS CONSTRUCTOR PASO 19");
        let scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        this.isScrolled(scrollPosition > 1);
      };

      updateScrollPosition(null);

      window.addEventListener('scroll', updateScrollPosition);
      window.addEventListener('resize', updateScrollPosition);
      window.addEventListener('orientationchange', updateScrollPosition);

      /* Links for debugging*/
      window.app = this;
      console.log("APP.JS CONSTRUCTOR FIN");
    }

    terminatePlugin() {
      this.ofscConnector.sendMessage({
        method: 'close',
      }).then((data) => {
        console.log('RESPONSE DATA: ');
      }).catch(e => {
        console.error(e);
      });
    }

    start() {
      this.ofscConnector.sendMessage({
        method: 'ready',
        sendInitData: true,
        dataItems: ['resource', 'scheduledActivities', 'nonScheduledActivities']
      }).then((message) => {
        switch (message.method) {
          case 'init':
            console.log('message INIT');
            this._saveAttributeDescription(message.attributeDescription);
            this.ofscConnector.sendMessage({
              method: 'initEnd'
            });
            break;
          case 'open':
            console.log("Mensaje OPEN");

            let savedResourceId = this._loadResourceId();
            let currentResourceId = null;

            if (message.resource && message.resource[constants.RESOURCE_PROPERTY_ID]) {
              currentResourceId = message.resource[constants.RESOURCE_PROPERTY_ID];
            }

            this._cleanupChanges(savedResourceId, currentResourceId);
            this.activityService.unserializeChanges(this._loadActivityChanges());

            this._saveResourceId(currentResourceId);

            this.open(message.activityList);
            break;
        }
      }).catch((e) => {
        console.error("Unable to start application: ", e);
      });
    }

    open(activityDictionary) {
      console.log("APP.JS OPEN INICIO");
      console.log("APP.JS OPEN PASO 1", activityDictionary);
      console.log("Se inicializa Plugin");
      if (!activityDictionary) {
        alert(this.i18n('error-popup-title') + '\n\n' + this.i18n('error-unsupported-screen'));
        this.terminatePlugin();
        return;
      }

      this.activityDictionary = activityDictionary || {};
      this.activityViewModelList = this.createActivityViewModelList(this.activityDictionary);
      this.lastCompletedActivityNumber = ko.observable(this.findLastCompletedActivityNumber(this.activityViewModelList));
      this.lastCompletedActivityViewModel = ko.pureComputed(() => {
        let number = this.lastCompletedActivityNumber();
        if (number === null) {
          return null;
        }
        return this.activityViewModelList[number] || null;
      });
      this.lastCompletedActivityPosition = ko.pureComputed(() => {
        if (!this.lastCompletedActivityViewModel()) {
          return null;
        }
        return this.lastCompletedActivityViewModel().activity.completionOrder || 0;
      });
      //console.log("Se calculan las actividades a mostrar");
      //this.nextActivities = ko.observableArray(this.calculateNextActivities(constants.NEXT_ACTIVITIES_NUMBER, this.lastCompletedActivityNumber()));
      this.nextActivities = ko.pureComputed(() => {
        //console.log('Solcita el litado de nextActivities');
        let nextActivitiesT = this.calculateNextActivities(constants.NEXT_ACTIVITIES_NUMBER, this.lastCompletedActivityNumber());
        //console.log(nextActivitiesT);
        return nextActivitiesT;
      });

      this.domElement.innerHTML = appTemplate;
      this.blockExpandedSignal = new Signal();
      this.submitBlockedSignal = new Signal();
      this.submitUnlockedSignal = new Signal();

      this.isSubmitBlocked = ko.observable(false);

      this.submitBlockedSignal.add(() => {
        this.isSubmitBlocked(true);
      });

      this.submitUnlockedSignal.add(() => {
        this.isSubmitBlocked(false);
      });

      this.isSubmitAvailable = ko.pureComputed(() => {
        //console.log('this.isSubmitBlocked()',this.isSubmitBlocked());
        //console.log('this.activityService.changesNumber()',this.activityService.changesNumber());
        return !this.isSubmitBlocked() && this.activityService.changesNumber() > 0;
      });

      this.buttonSubmitText = ko.pureComputed(() => {
        if (!this.isSubmitAvailable()) {
          return '';
        }
        return i18n('button-submit-title').replace('#NUMBER#', this.activityService.changesNumber());
      });

      this.buttonClearSearchText = ko.pureComputed(() => {
        //if (this.this.searchQuery().length > 0){
        return i18n('button-clear-search-title');
        //}
      });

      this.pendingActivities = ko.pureComputed(() => {
        console.log("this.activityViewModelList #####");
        return this.activityViewModelList.filter(item => item.activity.properties.astatus = 'pending').length;
      });


      ko.applyBindings(this, this.domElement);
      this.isLoaded(true);

      let searchInput = this.domElement.querySelector('#search-query');
      if (searchInput) {
        searchInput.focus && searchInput.focus();
      }
    }

    /**
     * Returns true on successful validation.
     * Returns error description as a string on unsuccessful validation.
     *
     * @param activity
     * @param meterReading
     * @returns {Boolean|String}
     */
    validateMeterReadingForActivity(activity, meterReading) {
      if (meterReading == '') {
        // the empty value is acceptable
        return true;
      }
      if (isNaN(meterReading)) {
        // it's not a number and not an empty value
        return i18n('error-validation-incorrect-value-nan');
      }
      if (meterReading < 0) {
        // the value must be above 0
        return i18n('error-validation-incorrect-value-neg');
      }
      return true;
    }

    /**
     * @param {ActivityModel} activity
     * @param meterReading
     * @returns {string | boolean}
     */
    meterReadingEntered(activity, meterReading, obsvMeterReading, obsvationsMeterReading) {
      //console.log('meterReadingEntered meterReading ',meterReading);
      let validationResult = this.validateMeterReadingForActivity(activity, meterReading);
      //console.log('meterReadingEntered validationResult ',validationResult);
      if (validationResult !== true) {
        return validationResult;
      }
      // validation is successful - continue:
      //console.log('meterReadingEntered activity.isPending() ',activity.isPending());
      if (activity.isPending()) {
        this.activityService.completeActivity(activity, meterReading, obsvMeterReading, obsvationsMeterReading, (this.lastCompletedActivityPosition() || 0) + 1);

        // find index of this activity:
        let activityIndex = -1;
        for (let i = 0; i < this.activityViewModelList.length; ++i) {
          if (this.activityViewModelList[i].activity === activity) {
            activityIndex = i;
            break;
          }
        }
        if (activityIndex >= 0) {
          // and make it last completed:
          this.lastCompletedActivityNumber(activityIndex);
        }
      } else {
        let uact = this.activityService.updateActivity(activity, meterReading, obsvMeterReading, obsvationsMeterReading);
        //console.log('meterReadingEntered uact ',uact);
        if (!meterReading) {
          // the activity was "un-completed", we need to find last complete activity from the list:
          this.lastCompletedActivityNumber(this.findLastCompletedActivityNumber(this.activityViewModelList));
        }
      }

      // after getting index of last completed activity - calculate next pending ones:
      this._saveActivityChanges(this.activityService.serializeChanges());
      this.searchQuery('');
      //this.nextActivities(this.calculateNextActivities(constants.NEXT_ACTIVITIES_NUMBER, this.lastCompletedActivityNumber()));
      this.setSerachKey(constants.NEXT_ACTIVITIES_NUMBER, this.lastCompletedActivityNumber());
      //console.log('meterReadingEntered nextActivities ',this.nextActivities);
      //this.searchQuery('');
      return true;
    }

    activityDetailsRequested(activity) {
      this.isProcessing(true);

      this.ofscConnector.sendMessage({
        method: 'close',
        backScreen: 'activity_by_id',
        backActivityId: activity.id.toString(),
      }).then((data) => {
        this.isProcessing(false);
        console.log('RESPONSE DATA: ');
      }).catch(e => {
        console.error(e);
      });
    }

    i18n(label) {
      return i18n(label);
    }

    normalizeQuery(query) {
      return query.toLowerCase().trim();
    }

    searchActivity(query) {
      query = this.normalizeQuery(query);
      //console.log("Query");
      console.log("APP.JS searchActivity INICIO");
      console.log("APP.JS searchActivity PASO 1", query);
      console.log("APP.JS searchActivity PASO 2", this.activityViewModelList);

      if (query === '') {
        return [];
      }
      console.log("Buscando: ");
      let actifind = this.activityViewModelList.find(item => item.searchString.indexOf(query) >= 0);
      console.log("APP.JS searchActivity PASO 3", actifind);

      let actifindRuta = this.activityViewModelList
        .filter(item => item.activity.properties.XA_Cons_Lect >= actifind.activity.properties.XA_Cons_Lect);
        console.log("APP.JS searchActivity PASO 4", actifindRuta);

      //Recorre todas las activity encontradas por el filtro
      actifindRuta.forEach(function(actifindRutaT) {

        //Si se seteo en true se retorna para volver a validar
        if (actifindRutaT.activity.toggleEditor = true) {
          actifindRutaT.activity.toggleEditor = false;
        }
        //Valida que la actividad current del for efue la
        //encontrada
        if (actifindRutaT == actifind) {
          //console.log('coincidencia');
          actifindRutaT.activity.toggleEditor = true;
          return;
        }
      });

      return this.calculateNextActivitiesSearch(actifindRuta);
    }

    submitChanges() {
      let activityList = this.activityService.getActivityUpdates() || {};

      this._submitChangesToOfsc(activityList);
    }

    clearSearch() {
      this.searchQuery('');
    }

    _submitChangesToOfsc(activityList) {
      this.isProcessing(true);
      this._saveIsChangesApplied(true);


      this.ofscConnector.sendMessage({
        method: 'close',
        activityList
      }).then((data) => {
        this.isProcessing(false);
        console.log('RESPONSE DATA: ');
      }).catch(message => {
        console.log('message: ', message);
        console.log('message.errors: ', message.errors);
        this._saveIsChangesApplied(false);

        if (!message || !message.errors) {
          alert(this.i18n('error-unexpected'));
          console.log(message.errors);
          return;
        }

        let errorRows = [];

        message.errors.forEach((error) => {
          let failedId = error.entityId;

          if (failedId) {
            delete activityList[failedId];
            let failedActivity = this.activityDictionary[failedId];
            errorRows.push((failedActivity && failedActivity[constants.ACTIVITY_PROPERTY_SEARCH_BY]) || '#' + failedId);
          }
        });

        let errorText = this.i18n('error-unable-to-update') + '\n\n' + errorRows.join('\n');

        alert(errorText);

        this._submitChangesToOfsc(activityList);
      });
    }

    _cleanupChanges(savedResourceId, currentResourceId) {
      let isChangesApplied = this._loadIsChangesApplied();

      if (isChangesApplied || savedResourceId !== currentResourceId) {
        this._saveActivityChanges({});
        this._saveIsChangesApplied(false);
      }
    }

    _loadActivityChanges() {
      try {
        console.log("Ingreso _loadActivityChanges");
        return PersistentStorage.loadData(STORAGE_KEY_ACTIVITY_CHANGES) || {};
      } catch (e) {
        return {};
      }
    }

    _loadAttributeDescription() {
      try {
        console.log("Ingreso _loadAttributeDescription");
        console.log("Ingreso _loadAttributeDescription PASO 1", window.localStorage);
        return PersistentStorage.loadData(STORAGE_KEY_ATTRIBUTE_DESCRIPTION) || {};
      } catch (e) {
        return {};
      }
    }

    _loadIsChangesApplied() {
      try {
        console.log("Ingreso _loadIsChangesApplied");

        return PersistentStorage.loadData(STORAGE_KEY_CHANGES_APPLIED) || false;
      } catch (e) {
        return false;
      }
    }

    _loadResourceId() {
      try {
        console.log("Ingreso _loadResourceId");

        return PersistentStorage.loadData(STORAGE_KEY_RESOURCE_ID) || null;
      } catch (e) {
        return null;
      }
    }

    _saveActivityChanges(changes) {
      console.log("Ingreso _saveActivityChanges");

      PersistentStorage.saveData(STORAGE_KEY_ACTIVITY_CHANGES, changes || {});
    }

    _saveAttributeDescription(description) {
      PersistentStorage.saveData(STORAGE_KEY_ATTRIBUTE_DESCRIPTION, description || {});
    }

    _saveIsChangesApplied(isApplied) {
      PersistentStorage.saveData(STORAGE_KEY_CHANGES_APPLIED, !!isApplied);
    }

    _saveResourceId(id) {
      PersistentStorage.saveData(STORAGE_KEY_RESOURCE_ID, id);
    }

    /**
     * Extracts all searchable text data form inventory properties.
     * Represents all text values of inventory as a 1 string at lower case where values are divided by "~" symbol.
     * Example "val1~val2~val3"
     *
     * @param activityDictionary
     * @returns {Array}
     */
     createActivityViewModelList(activityDictionary) {
       console.log("APP.JS createActivityViewModelList INICIO");
       console.log("APP.JS createActivityViewModelList PASO 1", activityDictionary);
       let lastCompletedActivity = null;
       let list = [];
       console.log("Inicia Diccinario ");
       Object.entries(activityDictionary).forEach(([aid, activityProperties]) => {
         console.log("APP.JS createActivityViewModelList PASO 2", aid);
         console.log("APP.JS createActivityViewModelList PASO 3", activityProperties);
         let activity = this.activityService.getModelInstance(activityProperties);
         console.log("APP.JS createActivityViewModelList PASO 4", activity);
         console.log("APP.JS createActivityViewModelList PASO 5", activity.customer_number);
         if (!activity.customer_number) {
           return;
         }

         let activitySearchStringValue = activity.customer_number;

         if (activitySearchStringValue === null || activitySearchStringValue === undefined) {
           return;
         }

         let searchString = activitySearchStringValue.toString().trim().toLowerCase();
         console.log("APP.JS createActivityViewModelList PASO 6", searchString);
         if (searchString.length <= 0) {
           return;
         }

         let order = activity.sortKey;
         console.log("APP.JS createActivityViewModelList PASO 7", order);

         let customerNumber = activity.customer_number;
         console.log("APP.JS createActivityViewModelList PASO 7", customerNumber);

         let activityViewModel = {
           activity,
           searchString,
           order
         };

         list.push(activityViewModel);
       });

       // return sorted list:

       return list.sort((first, second) => first.order - second.order);
     }

    createActivityViewModelList_OLD(activityDictionary) {
      console.log("APP.JS createActivityViewModelList INICIO");
      console.log("APP.JS createActivityViewModelList PASO 1", activityDictionary);
      let lastCompletedActivity = null;
      let list = [];
      console.log("Inicia Diccinario ");
      Object.entries(activityDictionary).forEach(([aid, activityProperties]) => {
        console.log("APP.JS createActivityViewModelList PASO 2", aid);
        console.log("APP.JS createActivityViewModelList PASO 3", activityProperties);
        let activity = this.activityService.getModelInstance(activityProperties);
        console.log("APP.JS createActivityViewModelList PASO 4", activity);
        console.log("APP.JS createActivityViewModelList PASO 5", activity.searchKey);
        if (!activity.searchKey) {
          return;
        }

        let activitySearchStringValue = activity.searchKey;

        if (activitySearchStringValue === null || activitySearchStringValue === undefined) {
          return;
        }

        let searchString = activitySearchStringValue.toString().trim().toLowerCase();
        console.log("APP.JS createActivityViewModelList PASO 6", searchString);
        if (searchString.length <= 0) {
          return;
        }

        let order = activity.sortKey;
        console.log("APP.JS createActivityViewModelList PASO 7", order);

        let customerNumber = activity.customer_number;
        console.log("APP.JS createActivityViewModelList PASO 7", customerNumber);

        let activityViewModel = {
          activity,
          searchString,
          order
        };

        list.push(activityViewModel);
      });

      // return sorted list:

      return list.sort((first, second) => first.order - second.order);
    }

    findLastCompletedActivityNumber(activityViewModelList) {
      console.log("APP.JS findLastCompletedActivityNumber INICIO");
      console.log("APP.JS findLastCompletedActivityNumber PASO 1", activityViewModelList);
      let lastCompletedActivityNumber = null;
      let lastCompletionOrder = null;
      console.log("APP.JS findLastCompletedActivityNumber PASO 2");
      console.log("APP.JS findLastCompletedActivityNumber PASO 3 NO ESTAN DEFINIDAS activityViewModel, index");
      activityViewModelList.forEach((activityViewModel, index) => {
        console.log("APP.JS findLastCompletedActivityNumber PASO 4");
        if (activityViewModel.activity.isComplete()) {
          console.log("APP.JS findLastCompletedActivityNumber PASO 5");
          if (lastCompletedActivityNumber === null || lastCompletionOrder < activityViewModel.activity.completionOrder) {
            console.log("APP.JS findLastCompletedActivityNumber PASO 6", activityViewModel.activity.completionOrder);
            lastCompletionOrder = activityViewModel.activity.completionOrder;
            lastCompletedActivityNumber = index;
          }
        }
      });
      console.log("APP.JS findLastCompletedActivityNumber FIN");
      return lastCompletedActivityNumber;
    }

    /**
     * @param activitiesNumber
     * @param lastCompletedActivityNumber
     * @returns {Array}
     */
    calculateNextActivities(activitiesNumber, lastCompletedActivityNumber) {
      let result = [];

      // the list is already sorted - just get appropriate next ones after the last completed:
      let startPosition = lastCompletedActivityNumber === null ? 0 : lastCompletedActivityNumber + 1;

      let foundNumber = 0;

      for (let i = startPosition, l = this.activityViewModelList.length; i < l && foundNumber < activitiesNumber; ++i) {
        let normalizedActivity = this.activityViewModelList[i];
        if (normalizedActivity.activity.isPending()) {
          //Se valida si es la primera actividad para que aparezca abierta
          if (i == startPosition) {
            normalizedActivity.activity.toggleEditor = true;
            //this.blockExpandedSignal(normalizedActivity.activity);
            //console.log('Primera activdad a mostrar',normalizedActivity.activity);
          } else {
            normalizedActivity.activity.toggleEditor = false;
          }
          //Se adiciona a las activities a mostrar
          result.push(normalizedActivity.activity);
          ++foundNumber;
        }


      }

      return result;
    }

    /**
     * Setea el filtro para que se realice una busqueda del siguiente registro
     * de forma automatica
     * @param activitiesNumber
     * @param lastCompletedActivityNumber
     * @returns
     */
    setSerachKey(activitiesNumber, lastCompletedActivityNumber) {

      // the list is already sorted - just get appropriate next ones after the last completed:
      let startPosition = lastCompletedActivityNumber === null ? 0 : lastCompletedActivityNumber + 1;
      let foundNumber = 0;

      for (let i = startPosition, l = this.activityViewModelList.length; i < l && foundNumber < activitiesNumber; ++i) {
        let normalizedActivity = this.activityViewModelList[i];
        if (normalizedActivity.activity.isPending()) {
          //Se valida si es la primera actividad para que aparezca abierta
          if (i == startPosition) {
            normalizedActivity.activity.toggleEditor = true;
            //this.blockExpandedSignal(normalizedActivity.activity);
            //console.log('Primera activdad a mostrar',normalizedActivity.activity);
            //console.log('Medidor',normalizedActivity.activity.searchKey);
            this.searchQuery(normalizedActivity.activity.searchKey);
            break;
          }
        }
      }
    }

    /**
     * @param activitiesNumber
     * @param lastCompletedActivityNumber
     * @returns {Array}
     */
    calculateNextActivitiesSearch(activities) {
      let result = [];

      // the list is already sorted - just get appropriate next ones after the last completed:

      let foundNumber = 0;

      for (let i = 0, l = activities.length; i < l && foundNumber < constants.NEXT_ACTIVITIES_NUMBER; ++i) {
        let normalizedActivity = activities[i];
        if (normalizedActivity.activity.isPending()) {
          //Se valida si es la primera actividad para que aparezca abierta
          if (i == 0) {
            normalizedActivity.activity.toggleEditor = true;
            //this.blockExpandedSignal(normalizedActivity.activity);
            //console.log('Search Primera activdad a mostrar',normalizedActivity.activity);
          } else {
            normalizedActivity.activity.toggleEditor = false;
          }

          result.push(normalizedActivity);
          ++foundNumber;
        }
      }

      return result;
    }
  }

  return PluginApp;
});
