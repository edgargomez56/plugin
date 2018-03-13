"use strict";
define([
    'knockout',
    './activity-model',
    '../constants'
], (ko,
    ActivityModel,
    constants) => {
    const SHORT_KEY_STATUS = 's';
    const SHORT_KEY_METER_READING = 'm';
    const SHORT_KEY_COMPLETION_ORDER = 'o';
    const SHORT_VALUE_STATUS_CANCELLED = 'n';
    const SHORT_VALUE_OBSV_METER_READING = 't';
    const SHORT_VALUE_OBSVATIONS_METER_READING = 'v';

    class ActivityService {

        constructor() {
            this._changes = {};

            this.changesNumber = ko.observable(0);
        }

        getModelInstance(activityProperties) {
            let model = new ActivityModel(activityProperties);
            let changes = this._changes[model.id];

            if (changes) {
                switch (changes[SHORT_KEY_STATUS]) {
                    case SHORT_VALUE_STATUS_CANCELLED:
                        model.cancel();
                        break;
                }

                if (changes[SHORT_KEY_METER_READING]) {
                    model.meterReading = changes[SHORT_KEY_METER_READING];
                }

                if (changes[SHORT_VALUE_OBSV_METER_READING]) {
                    model.obsvMeterReading = changes[SHORT_VALUE_OBSV_METER_READING];
                }

                if (changes[SHORT_VALUE_OBSVATIONS_METER_READING]) {
                    model.obsvationsMeterReading = changes[SHORT_VALUE_OBSVATIONS_METER_READING];
                }

                if (changes[SHORT_KEY_COMPLETION_ORDER]) {
                    model.completionOrder = changes[SHORT_KEY_COMPLETION_ORDER];
                }
            }

            return model;
        }

        completeActivity(activity, meterReading,obsvMeterReading,obsvationsMeterReading, completionOrder) {

            activity.meterReading = meterReading;
            activity.completionOrder = completionOrder;
            activity.obsvMeterReading = obsvMeterReading;
            activity.obsvationsMeterReading = obsvationsMeterReading;
            activity.cancel();

            this.changesNumber(this.changesNumber() + 1);

            this._changes[activity.id] = {
                [SHORT_KEY_STATUS]: SHORT_VALUE_STATUS_CANCELLED,
                [SHORT_KEY_METER_READING]: meterReading,
                [SHORT_KEY_COMPLETION_ORDER]: completionOrder,
                [SHORT_VALUE_OBSV_METER_READING]: obsvMeterReading,
                [SHORT_VALUE_OBSVATIONS_METER_READING]: obsvationsMeterReading
            };

        }

        updateActivity(activity, meterReading , obsvMeterReading,obsvationsMeterReading) {
            if (!activity.isAwaitingSynchronization()) {
                return false;
            }

            activity.meterReading = meterReading;
            activity.obsvMeterReading = obsvMeterReading;
            activity.obsvationsMeterReading = obsvationsMeterReading;

            /*
            * Se deshabilita la eliminacion de
            * la actividad cuando la hay lectura ya que la lectura
            * puede llegar null
            * */
            if (!meterReading) {
                activity.completionOrder = null;
                activity.undoCancel();
                this.changesNumber(this.changesNumber() - 1);
                if (this._changes[activity.id]) {
                    delete this._changes[activity.id];
                }
            } else {

                if (!this._changes[activity.id]) {
                    this._changes[activity.id] = {};
                }

                this._changes[activity.id][SHORT_KEY_METER_READING] = meterReading;
                this._changes[activity.id][SHORT_VALUE_OBSV_METER_READING] = obsvMeterReading;
                this._changes[activity.id][SHORT_VALUE_OBSVATIONS_METER_READING] = obsvationsMeterReading;
            }
        }

        serializeChanges() {
            return this._changes;
        }

        unserializeChanges(plainData) {
            this._changes = plainData || {};
            this.changesNumber(Object.keys(this._changes).length);
        }

        getActivityUpdates() {
            let updates = {};

            Object.entries(this._changes).forEach(([activityId, activityChanges]) => {
                let activityUpdate = {};

                if (activityChanges[SHORT_KEY_STATUS]) {
                    let status;

                    switch (activityChanges[SHORT_KEY_STATUS]) {
                        case SHORT_VALUE_STATUS_CANCELLED:
                            status = constants.ACTIVITY_STATUS_CANCELLED;
                            break;
                    }

                    activityUpdate[constants.ACTIVITY_PROPERTY_STATUS] = status;
                }

                if (activityChanges[SHORT_KEY_METER_READING]) {
                    activityUpdate[constants.ACTIVITY_PROPERTY_METER_READING] = activityChanges[SHORT_KEY_METER_READING];
                }

                if (activityChanges[SHORT_KEY_COMPLETION_ORDER]) {
                    activityUpdate[constants.ACTIVITY_PROPERTY_COMPLETION_ORDER] = activityChanges[SHORT_KEY_COMPLETION_ORDER];
                }

                if (activityChanges[SHORT_VALUE_OBSV_METER_READING] && activityChanges[SHORT_KEY_METER_READING].length > 0) {
                    activityUpdate[constants.ACTIVITY_PROPERTY_OBSV_METER_READING] = activityChanges[SHORT_VALUE_OBSV_METER_READING];
                }

                if (activityChanges[SHORT_VALUE_OBSV_METER_READING] && !(activityChanges[SHORT_KEY_METER_READING].length > 0)) {
                    activityUpdate[constants.ACTIVITY_PROPERTY_CNL_METER_READING] = activityChanges[SHORT_VALUE_OBSV_METER_READING];
                }

                if (activityChanges[SHORT_VALUE_OBSVATIONS_METER_READING]) {
                    activityUpdate[constants.ACTIVITY_PROPERTY_OBSVATIONS_METER_READING] = activityChanges[SHORT_VALUE_OBSVATIONS_METER_READING];
                }

                updates[activityId] = activityUpdate;
            });

            return updates;
        }
    }

    return ActivityService;
});
