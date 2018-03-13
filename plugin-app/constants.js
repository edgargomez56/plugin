define(() => ({
    // ---------------
    // Display options
    // ---------------
    MAX_SEARCH_ENTRIES_NUMBER: 50,
    MIN_SEARCH_REQUEST_LENGTH: 7,
    NEXT_ACTIVITIES_NUMBER: 10,

    PREFIX_COMPANY_GDO: 'GDO',
    PREFIX_COMPANY_STG: 'STG',
    PREFIX_COMPANY_GDP: 'GDP',
    PREFIX_COMPANY_CEO: 'CEO',

    // ----------------------------------
    // Labels of OFSC Resource properties
    // ----------------------------------

    // Resource ID. Unsaved changes will be erased if plugin is opened for Resource with other id
    RESOURCE_PROPERTY_ID: 'pid',


    // ----------------------------------
    // Labels of OFSC Activity properties
    // ----------------------------------

    // ID or serial number of meter
    ACTIVITY_PROPERTY_SEARCH_BY: 'XA_medidor',

    ACTIVITY_PROPERTY_METER_READING_ROUTE: 'XA_idRuta',

    // Activities in the list and search results are sorted by this property
    ACTIVITY_PROPERTY_SORT: 'XA_Cons_Lect',

    // Value of meter reading are stored in this property
    ACTIVITY_PROPERTY_METER_READING: 'XA_Lectura_Le',

    // Value of confirmed meter reading are stored in this property
    ACTIVITY_PROPERTY_CONFIRMED_METER_READING: 'XA_Lectura_Le',

    // Value of observation meter reading are stored in this property
    ACTIVITY_PROPERTY_OBSV_METER_READING: 'XA_Obs_Lectura',
    //XA_CNL_Lectura funciono ok XA_comment_lect

    // Value of CNL meter reading are stored in this property
    ACTIVITY_PROPERTY_CNL_METER_READING: 'XA_CNL_Lectura',

    // Value of observation meter reading are stored in this property
    //ACTIVITY_PROPERTY_OBSVATIONS_METER_READING: 'XA_Observation',
    ACTIVITY_PROPERTY_OBSVATIONS_METER_READING: 'XA_Observacion_Lec',

    // Next activities are suggested basing on this property
    ACTIVITY_PROPERTY_COMPLETION_ORDER: 'XA_completion_order',

    // Value of range lect min meter reading are stored in this property
    ACTIVITY_PROPERTY_RAN_LECT_MIN: 'XA_rangLectMin',

    // Value of range lect max meter reading are stored in this property
    ACTIVITY_PROPERTY_RAN_LECT_MAX: 'XA_rangLectMax',

    // Value of const lect meter reading are stored in this property
    ACTIVITY_PROPERTY_CONS_LECT: 'XA_Cons_Lect', //**Consecutivo Ruta de Lectura

    // Value of digit med reading are stored in this property
    ACTIVITY_PROPERTY_DIG_MED: 'XA_digitosMed', //(4)

    // Value of lim  med reading are stored in this property
    ACTIVITY_PROPERTY_LIM_MED: 'XA_limiteMed', //(9999)

    // Street address of activity
    ACTIVITY_PROPERTY_ADDRESS: 'XA_idDireccion',

    // Street address of activity
    ACTIVITY_PROPERTY_CUST_NUMBER: 'customer_number',

    // Street address of activity
    ACTIVITY_PROPERTY_APPT_NUMBER: 'appt_number',

    // Status of activity in OFSC
    ACTIVITY_PROPERTY_STATUS: 'astatus',

    // Unique ID of activity
    ACTIVITY_PROPERTY_ID: 'aid',


    // --------------------------------
    // Labels of OFSC Activity statuses
    // --------------------------------

    ACTIVITY_STATUS_PENDING: 'pending',
    ACTIVITY_STATUS_STARTED: 'started',
    ACTIVITY_STATUS_DELETED: 'deleted',
    ACTIVITY_STATUS_COMPLETE: 'complete',
    ACTIVITY_STATUS_CANCELLED: 'cancelled',
    ACTIVITY_STATUS_SUSPENDED: 'suspended',
    ACTIVITY_STATUS_NOTDONE: 'notdone'
}));
