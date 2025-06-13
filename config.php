<?php
// Konfigurace aplikace
define('OPENAI_API_KEY', getenv('OPENAI_API_KEY') ?: 'your-openai-api-key-here');
define('ASSISTANT_ID', 'asst_TND8x7S6HXvVWTTWRhAPfp75');
define('TIMEOUT_SECONDS', 900); // 15 minut

// Povolené domény pro CORS
$allowed_origins = [
    'http://localhost:8888',
    'http://localhost:8000', 
    'http://localhost:3000',
    'http://127.0.0.1:8888',
    'http://127.0.0.1:8000',
    'http://127.0.0.1:3000'
];

// Debugging
define('DEBUG_MODE', true);
define('LOG_REQUESTS', true);
?> 