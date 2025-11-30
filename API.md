# API Endpoints

This document outlines all the API endpoints for the application.

## Authentication Routes

### 1. Register a new user

- **URL:** `/api/auth/register`
- **Method:** `POST`
- **Description:** Registers a new user in the system.
- **Body:**
  - `name` (String, required): The user's name. Must contain only Arabic characters and spaces.
  - `phone` (String, required): The user's valid Egyptian phone number. Will be automatically converted to +20 format.
  - `email` (String, required): The user's email address.
  - `password` (String, required): The user's password. Password must be at least 6 characters long and contain an uppercase letter, a lowercase letter, a number, and a special character.
  - `role` (String, optional): The user's role. Can be `user` or `expert`. Defaults to `user`.
  - `governorate` (String, optional): The governorate. Must be one of the following: `القاهرة, الجيزة, الإسكندرية, الدقهلية, البحر الأحمر, البحيرة, الفيوم, الغربية, الإسماعيلية, المنوفية, القليوبية, الوادي الجديد, السويس, الشرقية, أسوان, بني سويف, بورسعيد, جنوب سيناء, كفر الشيخ, مطروح, قنا, شمال سيناء, أسيوط, سوهاج, الأقصر, دمياط, المنيا`.
  - `coordinates` (Array, optional): An array with two numbers [longitude, latitude].
- **Validation:**
  - Name must contain only Arabic characters and spaces
  - Phone must match Egyptian phone number format
  - Email must be a valid email address
  - Password must be at least 6 characters with uppercase, lowercase, number, and special character
  - Role must be either "user" or "expert"
  - Governorate must be from the valid list
  - Coordinates must be an array of exactly 2 numbers
- **Response:**
  - `message` (String): Success message.
  - `accessToken` (String): The access token.
  - `refreshToken` (String): The refresh token.
  - `user` (Object): The registered user's profile.
- **Error Responses:**shToken` (String): The refresh token.
  - `user` (Object): The registered user's profile.
- **Error Responses:**
  - `400 Bad Request`: Validation
  - `400 Bad Request`: Validation errors, user already exists
  - `500 Internal Server Error`: Server error

### 2. Login a user

- **URL:** `/api/auth/login`
- **Method:** `POST`
- **Description:** Logs in an existing user. Also allows updating the user's role and location.
- **Body:**
  - `email` (String, optional): The user's email address. Required if phone is not provided.
  - `phone` (String, optional): The user's valid Egyptian phone number. Required if email is not provided.
  - `password` (String, required): The user's password.
  - `role` (String, optional): The user's new role. Can be `user` or `expert`.
  - `governorate` (String, optional): The governorate. Must be one of the following: `القاهرة, الجيزة, الإسكندرية, الدقهلية, البحر الأحمر, البحيرة, الفيوم, الغربية, الإسماعيلية, المنوفية, القليوبية, الوادي الجديد, السويس, الشرقية, أسوان, بني سويف, بورسعيد, جنوب سيناء, كفر الشيخ, مطروح, قنا, شمال سيناء, أسيوط, سوهاج, الأقصر, دمياط, المنيا`.
  - `coordinates` (Array, optional): An array with two numbers [longitude, latitude].
- **Validation:**
  - Either email or phone must be provided
  - Email must be a valid email address (if provided)
  - Phone must match Egyptian phone number format (if provided)
  - Password is required
  - Role must be either "user" or "expert" (if provided)
  - Governorate must be from the valid list (if provided)
  - Coordinates must be an array of exactly 2 numbers (if provided)
- **Response:**
  - `message` (String): Success message.
  - `accessToken` (String): The access token.
  - `refreshToken` (String): The refresh token.
  - `user` (Object): The logged-in user's profile.
- **Error Responses:**
  - `400 Bad Request`: Validation errors, email or phone required
  - `401 Unauthorized`: Invalid credentials
  - `404 Not Found`: User not found
  - `500 Internal Server Error`: Server error

### 3. Refresh access token

- **URL:** `/api/auth/refresh-token`
- **Method:** `POST`
- **Description:** Refreshes the user's access token and issues a new refresh token (token rotation).
- **Body:**
  - `refreshToken` (String, required): The user's current refresh token.
- **Validation:**
  - Refresh token is required and must not be empty
- **Response:**
  - `accessToken` (String): The new access token.
  - `refreshToken` (String): The new refresh token.
- **Error Responses:**
  - `400 Bad Request`: Validation errors, missing refresh token
  - `401 Unauthorized`: Invalid or expired refresh token
  - `500 Internal Server Error`: Server error

### 4. Logout a user

- **URL:** `/api/auth/logout`
- **Method:** `POST`
- **Description:** Logs out the user and clears the refresh token.
- **Body:**
  - `refreshToken` (String, required): The user's refresh token.
- **Validation:**
  - Refresh token is required
- **Response:**
  - `204 No Content`: Successfully logged out.
- **Error Responses:**
  - `400 Bad Request`: Missing refresh token
  - `500 Internal Server Error`: Server error

### 5. Get current user

- **URL:** `/api/auth/me`
- **Method:** `GET`
- **Description:** Retrieves the profile of the currently authenticated user.
- **Headers:**
  - `Authorization`: `Bearer <access_token>`
- **Validation:**
  - Valid access token required in Authorization header
- **Response:**
  - `user` (Object): The current user's profile.
- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid access token
  - `404 Not Found`: User not found
  - `500 Internal Server Error`: Server error

### 6. Update user profile
  
- **URL:** `/api/auth/me`
- **Method:** `PUT`
- **Description:** Updates the profile of the currently authenticated user.
- **Headers:**
  - `Authorization`: `Bearer <access_token>`
- **Body:**
  - `name` (String, optional): The user's new name. Must contain only Arabic characters and spaces.
  - `governorate` (String, optional): The governorate. Must be one of the following: `القاهرة, الجيزة, الإسكندرية, الدقهلية, البحر الأحمر, البحيرة, الفيوم, الغربية, الإسماعيلية, المنوفية, القليوبية, الوادي الجديد, السويس, الشرقية, أسوان, بني سويف, بورسعيد, جنوب سيناء, كفر الشيخ, مطروح, قنا, شمال سيناء, أسيوط, سوهاج, الأقصر, دمياط, المنيا`.
  - `coordinates` (Array, optional): An array with two numbers [longitude, latitude].
  - `imageUrl` (String, optional): The user's new image URL.
  - `whatsapp` (String, optional): The user's WhatsApp number. Will be automatically converted to +20 format.
- **Validation:**
  - Valid access token required
  - Name must contain only Arabic characters and spaces (if provided)
  - Governorate must be from the valid list (if provided)
  - Coordinates must be an array of exactly 2 numbers (if provided)
  - Image URL must be a string (if provided)
  - Whatsapp must match Egyptian phone number format (if provided)
- **Response:**
  - `message` (String): Success message.
  - `user` (Object): The updated user's profile.
- **Error Responses:**
  - `400 Bad Request`: Validation errors
  - `401 Unauthorized`: Missing or invalid access token
  - `404 Not Found`: User not found
  - `500 Internal Server Error`: Server error

### 7. Update FCM token

- **URL:** `/api/auth/fcm-token`
- **Method:** `PUT`
- **Description:** Updates the user's Firebase Cloud Messaging (FCM) token for push notifications.
- **Headers:**
  - `Authorization`: `Bearer <access_token>`
- **Body:**
  - `fcmToken` (String, required): The new FCM token.
- **Validation:**
  - Valid access token required
  - FCM token is required and must be a string
- **Response:**
  - `message` (String): Success message.
- **Error Responses:**
  - `400 Bad Request`: Validation errors, missing FCM token
  - `401 Unauthorized`: Missing or invalid access token
  - `404 Not Found`: User not found
  - `500 Internal Server Error`: Server error

### 8. Forgot password

- **URL:** `/api/auth/forgot-password`
- **Method:** `POST`
- **Description:** Sends a password reset link to the user's email.
- **Body:**
  - `email` (String, required): The user's email address.
- **Validation:**
  - Email is required and must be a valid email address
- **Response:**
  - `message` (String): Success message (OTP sent).
- **Error Responses:**
  - `400 Bad Request`: Validation errors, invalid email
  - `404 Not Found`: User not found
  - `500 Internal Server Error`: Server error

### 9. Reset password

- **URL:** `/api/auth/reset-password`
- **Method:** `POST`
- **Description:** Resets the user's password using an OTP.
- **Body:**
  - `email` (String, required): The user's email address.
  - `otp` (Number, required): The 6-digit OTP from the email.
  - `password` (String, required): The new password. Password must be at least 6 characters long and contain an uppercase letter, a lowercase letter, a number, and a special character.
- **Validation:**
  - Email is required and must be a valid email address
  - OTP must be exactly 6 digits
  - Password must be at least 6 characters with uppercase, lowercase, number, and special character
- **Response:**
  - `message` (String): Success message.
- **Error Responses:**
  - `400 Bad Request`: Validation errors, invalid OTP, OTP expired
  - `404 Not Found`: User not found
  - `500 Internal Server Error`: Server error

### 10. Disable expert suggestions

- **URL:** `/api/auth/disable-suggestions`
- **Method:** `POST`
- **Description:** Disables automated expert suggestions for the authenticated user. This stops the system from sending hourly push notifications with expert recommendations. User's last search data will be cleared and suggestions will remain disabled until the user performs a new search.
- **Headers:**
  - `Authorization`: `Bearer <access_token>`
- **Validation:**
  - Valid access token required
- **Response:**
  - `message` (String): Success message.
- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid access token
  - `404 Not Found`: User not found
  - `500 Internal Server Error`: Server error

## Contact Routes

### 1. Get expert contact information

- **URL:** `/api/contacts/:expertId`
- **Method:** `GET`
- **Description:** Retrieves contact information for a specific expert and creates a contact request record.
- **Headers:**
  - `Authorization`: `Bearer <access_token>`
- **Parameters:**
  - `expertId` (String, required): The MongoDB ObjectId of the expert.
- **Query Parameters:**
  - `subServiceId` (String, required): The MongoDB ObjectId of the sub-service.
  - `lat` (Number, optional): The latitude of the user's location. Must be between -90 and 90. If provided, `long` must also be provided.
  - `long` (Number, optional): The longitude of the user's location. Must be between -180 and 180. If provided, `lat` must also be provided.
- **Validation:**
  - Valid access token required
  - Expert ID must be a valid MongoDB ObjectId
  - Sub-service ID is required and must be a valid MongoDB ObjectId
  - If coordinates are provided, both lat and long must be present
  - Latitude must be in range [-90, 90]
  - Longitude must be in range [-180, 180]
  - Expert must exist and have role "expert"
- **Response:**
  - `message` (String): Success message.
  - `expert` (Object): The expert's contact information.
    - `id` (String): The expert's ID.
    - `name` (String): The expert's name.
    - `phone` (String): The expert's phone number.
    - `email` (String): The expert's email address.
    - `whatsappLink` (String): Link to open WhatsApp chat with the expert.
  - `contactRequest` (Object): The created contact request details.
    - `id` (String): The contact request ID.
    - `subService` (String): The sub-service ID.
    - `location` (Object, optional): The location coordinates if provided.
    - `createdAt` (Date): The timestamp when the contact request was created.
- **Error Responses:**
  - `400 Bad Request`: Validation errors, invalid IDs, invalid coordinates, incomplete coordinate pair, user is not an expert
  - `401 Unauthorized`: Missing or invalid access token
  - `404 Not Found`: Expert not found
  - `500 Internal Server Error`: Server error

### 2. Expert Response to Follow-up

- **URL:** `/api/contacts/:id/expert-response`
- **Method:** `POST`
- **Description:** Allows an expert to respond to a follow-up check regarding a contact request (Deal / No Deal).
- **Headers:**
  - `Authorization`: `Bearer <access_token>`
- **Parameters:**
  - `id` (String, required): The ID of the contact request.
- **Body:**
  - `hasDeal` (Boolean, required): `true` if a deal was reached, `false` otherwise.
- **Validation:**
  - Valid access token required
  - User must be the expert associated with the contact request
  - `hasDeal` is required and must be a boolean
- **Response:**
  - `message` (String): Success message.
- **Error Responses:**
  - `403 Forbidden`: User is not authorized (not the expert for this contact)
  - `404 Not Found`: Contact request not found
  - `500 Internal Server Error`: Server error

### 3. Customer Response to Follow-up

- **URL:** `/api/contacts/:id/customer-response`
- **Method:** `POST`
- **Description:** Allows a customer to respond to a follow-up check. If the expert confirmed a deal, the customer provides the date. If the expert denied a deal, the customer confirms or disputes.
- **Headers:**
  - `Authorization`: `Bearer <access_token>`
- **Parameters:**
  - `id` (String, required): The ID of the contact request.
- **Body:**
  - `dealDate` (Date, optional): The agreed date for the service (required if confirming a deal).
  - `confirmNoDeal` (Boolean, optional): `true` to confirm that no deal was reached.
- **Validation:**
  - Valid access token required
  - User must be the customer associated with the contact request
  - Either `dealDate` or `confirmNoDeal` must be provided
- **Response:**
  - `message` (String): Success message (e.g., "Deal date confirmed" or "No deal confirmed").
- **Error Responses:**
  - `400 Bad Request`: Invalid response data
  - `403 Forbidden`: User is not authorized (not the customer for this contact)
  - `404 Not Found`: Contact request not found
  - `500 Internal Server Error`: Server error

## Expert Routes

### 1. Get available experts

- **URL:** `/api/experts`
- **Method:** `GET` 
- **Description:** Retrieves a list of available experts.
- **Validation:**
  - None (public endpoint)
- **Response:**
  - Array of expert objects with populated service types
- **Error Responses:**
  - `500 Internal Server Error`: Server error

### 2. Get near experts

- **URL:** `/api/experts/near`
- **Method:** `GET`
- **Description:** Retrieves a list of experts near the user's location. Can filter by coordinates or governorate. If user is authenticated and no location is provided, uses the user's saved location. **Note:** When an authenticated user searches with a `serviceId` or `subServiceId`, the system automatically tracks this search and enables expert suggestions. The user will receive hourly push notifications with expert recommendations for up to 24 hours, unless they create a contact request or manually disable suggestions.
- **Headers:**
  - `Authorization`: `Bearer <access_token>` (optional - if provided, uses user's location as fallback and tracks search for suggestions)
- **Query Parameters:**
  - `serviceId` (String, optional): The MongoDB ObjectId of the service.
  - `subServiceId` (String, optional): The MongoDB ObjectId of the sub-service.
  - `coordinates` (Array, optional): An array with two numbers [longitude, latitude].
  - `governorate` (String, optional): The governorate. Must be one of the following: `القاهرة, الجيزة, الإسكندرية, الدقهلية, البحر الأحمر, البحيرة, الفيوم, الغربية, الإسماعيلية, المنوفية, القليوبية, الوادي الجديد, السويس, الشرقية, أسوان, بني سويف, بورسعيد, جنوب سيناء, كفر الشيخ, مطروح, قنا, شمال سيناء, أسيوط, سوهاج, الأقصر, دمياط, المنيا`.
  - `range` (Integer, optional): The range in kilometers to search for experts. Must be a positive integer. If not provided with coordinates, it will search for experts in the same governorate.
- **Validation:**
  - Service ID must be a valid MongoDB ObjectId (if provided)
  - Sub-service ID must be a valid MongoDB ObjectId (if provided)
  - Coordinates must be an array of 2 numbers with valid latitude/longitude ranges (if provided)
  - Governorate must be from the valid list (if provided)
  - Range must be a positive integer (if provided)
- **Response:**
  - Array of nearby expert objects with populated service types
- **Error Responses:**
  - `400 Bad Request`: Validation errors, invalid coordinates or governorate
  - `500 Internal Server Error`: Server error

### 3. Update expert availability

- **URL:** `/api/experts/availability`
- **Method:** `PUT`
- **Description:** Updates the availability of an expert.
- **Headers:**
  - `Authorization`: `Bearer <access_token>`
- **Body:**
  - `isAvailable` (Boolean, required): The expert's new availability status.
- **Validation:**
  - Valid access token required
  - User must have role "expert"
  - isAvailable is required and must be a boolean
- **Response:**
  - `message` (String): Success message.
  - `expert` (Object): Updated expert profile.
- **Error Responses:**
  - `400 Bad Request`: Validation errors, user is not an expert
  - `401 Unauthorized`: Missing or invalid access token
  - `404 Not Found`: Expert not found
  - `500 Internal Server Error`: Server error

  - `message` (String): Success message.
  - `expert` (Object): Updated expert profile with all fields.
- **Error Responses:**
  - `400 Bad Request`: Validation errors, phone already in use, expert profile not found
  - `401 Unauthorized`: Missing or invalid access token
  - `403 Forbidden`: User is not an expert
  - `404 Not Found`: User not found
  - `500 Internal Server Error`: Server error

### 5. Get expert profile by ID

- **URL:** `/api/experts/profile/:id`
- **Method:** `GET`
- **Description:** Retrieves the profile of a specific expert.
- **Headers:**
  - `Authorization`: `Bearer <access_token>`
- **Parameters:**
  - `id` (String, required): The ID of the expert.
- **Validation:**
  - Valid access token required
  - Expert ID must be a valid MongoDB ObjectId
- **Response:**
  - `expert` (Object): The expert's profile.
- **Error Responses:**
  - `400 Bad Request`: Invalid expert ID
  - `401 Unauthorized`: Missing or invalid access token
  - `404 Not Found`: Expert not found
  - `500 Internal Server Error`: Server error

## Service Routes

### 6. Add Sub-Service to Profile

- **URL:** `/api/experts/sub-services/:subServiceId`
- **Method:** `POST`
- **Description:** Adds a sub-service to the expert's profile.
- **Headers:**
  - `Authorization`: `Bearer <access_token>`
- **Parameters:**
  - `subServiceId` (String, required): The ID of the sub-service to add.
- **Validation:**
  - Valid access token required
  - User must have role "expert"
  - Sub-service ID must be a valid MongoDB ObjectId
- **Response:**
  - `message` (String): Success message.
  - `serviceTypes` (Array): Updated array of sub-service IDs.
- **Error Responses:**
  - `400 Bad Request`: Validation errors, invalid sub-service ID
  - `401 Unauthorized`: Missing or invalid access token
  - `404 Not Found`: Expert not found or Sub-service not found
  - `500 Internal Server Error`: Server error

### 7. Remove Sub-Service from Profile

- **URL:** `/api/experts/sub-services/:subServiceId`
- **Method:** `DELETE`
- **Description:** Removes a sub-service from the expert's profile.
- **Headers:**
  - `Authorization`: `Bearer <access_token>`
- **Parameters:**
  - `subServiceId` (String, required): The ID of the sub-service to remove.
- **Validation:**
  - Valid access token required
  - User must have role "expert"
  - Sub-service ID must be a valid MongoDB ObjectId
- **Response:**
  - `message` (String): Success message.
  - `serviceTypes` (Array): Updated array of sub-service IDs.
- **Error Responses:**
  - `400 Bad Request`: Validation errors, invalid sub-service ID
  - `401 Unauthorized`: Missing or invalid access token
  - `404 Not Found`: Expert not found
  - `500 Internal Server Error`: Server error

  - `500 Internal Server Error`: Server error

### 8. Update Expert Stats

- **URL:** `/api/experts/stats`
- **Method:** `PUT`
- **Description:** Updates the expert's average price per hour and years of experience.
- **Headers:**
  - `Authorization`: `Bearer <access_token>`
- **Body:**
  - `averagePricePerHour` (Number, optional): The expert's average price per hour.
  - `yearsExperience` (Number, optional): The expert's years of experience.
- **Validation:**
  - Valid access token required
  - User must have role "expert"
  - Average price per hour must be a number (if provided)
  - Years of experience must be a number (if provided)
- **Response:**
  - `message` (String): Success message.
  - `expertProfile` (Object): Updated expert profile.
- **Error Responses:**
  - `400 Bad Request`: Validation errors
  - `401 Unauthorized`: Missing or invalid access token
  - `404 Not Found`: Expert not found
  - `500 Internal Server Error`: Server error

## Service Routes



### 1. Get all services

- **URL:** `/api/services`
- **Method:** `GET`
- **Description:** Retrieves a list of all services.
- **Validation:**
  - None
- **Response:**
  - Array of service objects with their details
- **Error Responses:**
  - `500 Internal Server Error`: Server error

### 2. Add a new service

- **URL:** `/api/services`
- **Method:** `POST`
- **Description:** Adds a new service (admin only).
- **Headers:**
  - `Authorization`: `Bearer <access_token>`
- **Body:**
  - `name` (String, required): The name of the service.
  - `description` (String, required): The description of the service.
  - `image` (String, required): The image URL of the service.
- **Validation:**
  - Valid access token required
  - User must have role "admin"
  - Name is required and must be a string
  - Description is required and must be a string
  - Image URL is required and must be a string
- **Response:**
  - `message` (String): Success message.
  - `service` (Object): The created service.
- **Error Responses:**
  - `400 Bad Request`: Validation errors, missing required fields
  - `401 Unauthorized`: Missing or invalid access token
  - `403 Forbidden`: User is not an admin
  - `500 Internal Server Error`: Server error

### 3. Get all sub-services

- **URL:** `/api/services/sub-services`
- **Method:** `GET`
- **Description:** Retrieves a list of all sub-services.
- **Validation:**
  - None
- **Response:**
  - Array of sub-service objects
- **Error Responses:**
  - `500 Internal Server Error`: Server error

### 4. Get sub-services by service ID

- **URL:** `/api/services/sub-services/:serviceId`
- **Method:** `GET`
- **Description:** Retrieves a list of sub-services for a specific service.
- **Parameters:**
  - `serviceId` (String, required): The ID of the service.
- **Validation:**
  - Service ID must be a valid MongoDB ObjectId
- **Response:**
  - Array of sub-service objects for the specified service
- **Error Responses:**
  - `400 Bad Request`: Invalid service ID
  - `404 Not Found`: Service not found
  - `500 Internal Server Error`: Server error

## Upload Routes

### 1. Upload profile image

- **URL:** `/api/upload/profile-image`
- **Method:** `POST`
- **Description:** Uploads a profile image for the user.
- **Headers:**
  - `Authorization`: `Bearer <access_token>`
- **Body:**
  - `image` (File, required): The image file to upload.
- **Validation:**
  - Valid access token required
  - Image file is required
  - File must be a valid image format (e.g., jpg, png, jpeg)
  - File size must be within allowed limits
- **Response:**
  - `message` (String): Success message.
  - `imageUrl` (String): The URL of the uploaded image.
- **Error Responses:**
  - `400 Bad Request`: Validation errors, missing or invalid image file
  - `401 Unauthorized`: Missing or invalid access token
  - `500 Internal Server Error`: Server error

### 2. Upload service image

- **URL:** `/api/upload/service-image`
- **Method:** `POST`
- **Description:** Uploads an image for a service.
- **Headers:**
  - `Authorization`: `Bearer <access_token>`
- **Body:**
  - `image` (File, required): The image file to upload.
- **Validation:**
  - Valid access token required
  - User must have role "admin"
  - Image file is required
  - File must be a valid image format (e.g., jpg, png, jpeg)
  - File size must be within allowed limits
- **Response:**
  - `message` (String): Success message.
  - `imageUrl` (String): The URL of the uploaded image.
- **Error Responses:**
  - `400 Bad Request`: Validation errors, missing or invalid image file
  - `401 Unauthorized`: Missing or invalid access token
  - `403 Forbidden`: User is not an admin
  - `500 Internal Server Error`: Server error

## Notification Routes

### 1. Get user notifications

- **URL:** `/api/notifications`
- **Method:** `GET`
- **Description:** Retrieves a paginated list of notifications for the authenticated user.
- **Headers:**
  - `Authorization`: `Bearer <access_token>`
- **Query Parameters:**
  - `page` (Integer, optional): The page number (default: 1).
  - `limit` (Integer, optional): The number of notifications per page (default: 20).
- **Validation:**
  - Valid access token required
- **Response:**
  - `notifications` (Array): List of notification objects.
    - `id` (String): The notification ID.
    - `title` (String): The notification title.
    - `body` (String): The notification body.
    - `imageUrl` (String): The notification image URL.
    - `data` (Object): Additional data payload.
    - `createdAt` (Date): The timestamp when the notification was created.
  - `currentPage` (Integer): The current page number.
  - `totalPages` (Integer): The total number of pages.
  - `totalNotifications` (Integer): The total number of notifications.
- **Error Responses:**
  - `401 Unauthorized`: Missing or invalid access token
  - `500 Internal Server Error`: Server error

## Location Routes

### 1. Get all governorates

- **URL:** `/api/location/governorates`
- **Method:** `GET`
- **Description:** Retrieves a list of all governorates in Egypt.
- **Validation:**
  - None
- **Response:**
  - `governorates` (Array): List of governorate names.
- **Error Responses:**
  - `500 Internal Server Error`: Server error
