export enum ToolType {
    // Core tool types
    ANALYSIS = 'ANALYSIS',
    TRANSFORMATION = 'TRANSFORMATION',
    VALIDATION = 'VALIDATION',
    GENERATION = 'GENERATION',
    EXTRACTION = 'EXTRACTION',
    
    // Data-specific tools
    DATA_LOADER = 'DATA_LOADER',
    DATA_CLEANER = 'DATA_CLEANER',
    DATA_TRANSFORMER = 'DATA_TRANSFORMER',
    DATA_VALIDATOR = 'DATA_VALIDATOR',
    
    // Integration tools
    API = 'API',
    DATABASE = 'DATABASE',
    FILE_SYSTEM = 'FILE_SYSTEM',
    
    // Utility tools
    FORMATTER = 'FORMATTER',
    CALCULATOR = 'CALCULATOR',
    CONVERTER = 'CONVERTER',
    
    // Custom/Plugin tools
    CUSTOM = 'CUSTOM',
    PLUGIN = 'PLUGIN'
  }
  
  export enum ToolExecutionMode {
    SYNC = 'SYNC',
    ASYNC = 'ASYNC',
    BATCH = 'BATCH',
    STREAM = 'STREAM'
  }