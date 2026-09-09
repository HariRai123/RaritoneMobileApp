import api from "./api";

export type TryOnProduct = {
  _id?: string;
  name?: string;
  brand?: string;
  image?: string;
  price?: number;
  category?: string;
  stock?: number;
};

export type TryOnSession = {
  _id?: string;
  id?: string;

  userId?: string;

  productId?: string | TryOnProduct;
  product?: TryOnProduct;

  inputImageReference?: string | null;
  resultImageReference?: string | null;

  aiModelVersion?: string;

  status: "pending" | "processing" | "completed" | "failed" | string;

  processingTime?: number | null;

  personDetected?: boolean;

  poseResult?: Record<string, unknown>;

  bodyMeasurements?: Record<string, unknown>;

  message?: string;

  errorCode?: string | null;

  errorMessage?: string;

  retryCount?: number;

  createdAt?: string;
  updatedAt?: string;
};

export type TryOnResponse = {
  success?: boolean;
  message?: string;

  tryOn?: TryOnSession;

  result?: TryOnSession;

  session?: TryOnSession;

  sessionId?: string;

  _id?: string;
  id?: string;
};

export type TryOnHistoryResponse = {
  success?: boolean;

  results: TryOnSession[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

/*
|--------------------------------------------------------------------------
| Helper
|--------------------------------------------------------------------------
*/

function createImageFormData(image: string, productId?: string) {
  const formData = new FormData();

  if (productId) {
    formData.append("productId", String(productId));
  }

  formData.append("person_image", {
    uri: image,
    name: "person.jpg",
    type: "image/jpeg",
  } as any);

  return formData;
}

/*
|--------------------------------------------------------------------------
| Create Try-On Session
|
| POST /api/tryon
|--------------------------------------------------------------------------
*/

export async function createTryOn({
  image,
  productId,
}: {
  image: string;
  productId: string;
}): Promise<TryOnResponse> {
  if (!image) {
    throw new Error("Person image is required.");
  }

  if (!productId) {
    throw new Error("Product is required.");
  }

  const formData = createImageFormData(image, productId);

  try {
    const response = await api.post("/tryon", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },

      timeout: 180000,
    });

    console.log("CREATE TRY-ON RESPONSE:", response.data);

    return response.data as TryOnResponse;
  } catch (error: any) {
    console.log(
      "CREATE TRY-ON ERROR:",
      error?.response?.data || error?.message || error,
    );

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| Get Single Try-On Session
|
| GET /api/tryon/session/:id
|--------------------------------------------------------------------------
*/

export async function getTryOnSession(id: string): Promise<{
  success?: boolean;
  message?: string;
  result?: TryOnSession;
}> {
  if (!id) {
    throw new Error("Try-on session ID is required.");
  }

  try {
    const response = await api.get(`/tryon/session/${id}`);

    return response.data;
  } catch (error: any) {
    console.log(
      "GET TRY-ON SESSION ERROR:",
      error?.response?.data || error?.message || error,
    );

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| Retry Try-On
|
| POST /api/tryon/session/:id/retry
|--------------------------------------------------------------------------
*/

export async function retryTryOn(id: string): Promise<TryOnResponse> {
  if (!id) {
    throw new Error("Try-on session ID is required.");
  }

  try {
    const response = await api.post(`/tryon/session/${id}/retry`);

    console.log("RETRY TRY-ON RESPONSE:", response.data);

    return response.data as TryOnResponse;
  } catch (error: any) {
    console.log(
      "RETRY TRY-ON ERROR:",
      error?.response?.data || error?.message || error,
    );

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| Try-On History
|
| GET /api/tryon/history
|--------------------------------------------------------------------------
*/

export async function getTryOnHistory(
  page = 1,
  limit = 10,
): Promise<TryOnHistoryResponse> {
  try {
    const response = await api.get("/tryon/history", {
      params: {
        page,
        limit,
      },
    });

    return response.data as TryOnHistoryResponse;
  } catch (error: any) {
    console.log(
      "GET TRY-ON HISTORY ERROR:",
      error?.response?.data || error?.message || error,
    );

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| Get History Result By ID
|--------------------------------------------------------------------------
*/

export async function getTryOnHistoryById(id: string) {
  return getTryOnSession(id);
}

/*
|--------------------------------------------------------------------------
| My Try-On Results
|
| GET /api/tryon/my-results
|--------------------------------------------------------------------------
*/

export async function getMyTryOnResults(page = 1, limit = 10) {
  try {
    const response = await api.get("/tryon/my-results", {
      params: {
        page,
        limit,
      },
    });

    return response.data;
  } catch (error: any) {
    console.log(
      "GET MY TRY-ON RESULTS ERROR:",
      error?.response?.data || error?.message || error,
    );

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| Legacy Analyze Endpoint
|
| POST /api/tryon/analyze
|
| Keep this only if your backend still exposes it.
|--------------------------------------------------------------------------
*/

export async function analyzeTryOn(image: {
  uri: string;
  name?: string;
  type?: string;
}) {
  const formData = new FormData();

  formData.append("person_image", {
    uri: image.uri,
    name: image.name || "person.jpg",
    type: image.type || "image/jpeg",
  } as any);

  const response = await api.post("/tryon/analyze", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 180000,
  });

  return response.data;
}
