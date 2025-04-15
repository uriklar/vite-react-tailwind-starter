interface BinResponse {
  metadata: {
    id: string;
    createdAt: string;
    private: boolean;
  };
  record: any;
}

interface MasterIndex {
  submissions: Array<{
    binId: string;
    userId: string;
    name: string;
    timestamp: string;
  }>;
}

const encodedApiKey = import.meta.env.VITE_JSONBIN_API_KEY;
const API_KEY = encodedApiKey ? atob(encodedApiKey) : null; // Decode using atob()

const BASE_URL = "https://api.jsonbin.io/v3";

export const createBin = async (
  data: unknown,
  binName = "bracket"
): Promise<BinResponse | null> => {
  if (!API_KEY) {
    console.error(
      "JSONBin API key not found. Make sure VITE_JSONBIN_API_KEY is set in your .env file."
    );
    return null;
  }

  const response = await fetch(`${BASE_URL}/b`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": API_KEY,
      "X-Bin-Name": binName,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    console.error("Failed to create bin:", await response.text());
    return null;
  }

  return response.json();
};

export const getBin = async (binId: string): Promise<BinResponse | null> => {
  if (!API_KEY) {
    console.error(
      "JSONBin API key not found. Make sure VITE_JSONBIN_API_KEY is set in your .env file."
    );
    return null;
  }

  const response = await fetch(`${BASE_URL}/b/${binId}/latest`, {
    method: "GET",
    headers: {
      "X-Master-Key": API_KEY,
    },
  });

  if (!response.ok) {
    console.error("Failed to get bin:", await response.text());
    return null;
  }

  // The response for getting the latest version is the record itself
  return response.json();
};

export const updateBin = async (
  binId: string,
  data: unknown
): Promise<BinResponse | null> => {
  if (!API_KEY) {
    console.error(
      "JSONBin API key not found. Make sure VITE_JSONBIN_API_KEY is set in your .env file."
    );
    return null;
  }

  const response = await fetch(`${BASE_URL}/b/${binId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": API_KEY,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    console.error("Failed to update bin:", await response.text());
    return null;
  }

  return response.json();
};

export const getOfficialResults = async (): Promise<any | null> => {
  const resultsBinId = import.meta.env.VITE_JSONBIN_RESULTS_BIN_ID;
  if (!resultsBinId) {
    console.error(
      "Results Bin ID not found. Make sure VITE_JSONBIN_RESULTS_BIN_ID is set in your .env file."
    );
    return null;
  }

  if (!API_KEY) {
    console.error("JSONBin API key not found.");
    return null;
  }

  const response = await fetch(`${BASE_URL}/b/${resultsBinId}/latest`, {
    method: "GET",
    headers: {
      "X-Master-Key": API_KEY,
    },
  });

  if (!response.ok) {
    console.error("Failed to get official results:", await response.text());
    return null;
  }

  // Expecting the bin content to be { results: { ... } }
  const data = await response.json();
  return data.record?.results ? data.record.results : data.results ?? null; // Handle potential wrapping in 'record' + ensure results key exists
};

// ---- Master Index Functions ----

const getMasterIndexBinId = (): string | undefined => {
  const id = import.meta.env.VITE_JSONBIN_MASTER_INDEX_BIN_ID;
  if (!id) {
    console.error(
      "Master Index Bin ID not found. Make sure VITE_JSONBIN_MASTER_INDEX_BIN_ID is set in your .env file."
    );
  }
  return id;
};

// Fetches the entire master index content
export const getMasterIndex = async (): Promise<MasterIndex | null> => {
  const indexBinId = getMasterIndexBinId();
  if (!indexBinId || !API_KEY) return null;

  const response = await fetch(`${BASE_URL}/b/${indexBinId}/latest`, {
    method: "GET",
    headers: { "X-Master-Key": API_KEY },
  });

  if (response.status === 404) {
    // Handle case where index bin might be new/empty
    console.log("Master index bin not found or empty, returning default.");
    return { submissions: [] }; // Return default structure
  }

  if (!response.ok) {
    console.error("Failed to get master index:", await response.text());
    return null;
  }

  const data = await response.json();
  // Ensure the response has the expected structure
  const indexData = data.record ?? data;
  return indexData.submissions ? indexData : { submissions: [] };
};

// Updates the master index bin with new data
export const updateMasterIndex = async (
  indexData: MasterIndex
): Promise<BinResponse | null> => {
  const indexBinId = getMasterIndexBinId();
  if (!indexBinId || !API_KEY) return null;

  // Validate data structure minimally
  if (!indexData || !Array.isArray(indexData.submissions)) {
    console.error("Invalid master index data format for update.");
    return null;
  }

  const response = await fetch(`${BASE_URL}/b/${indexBinId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": API_KEY,
      // 'X-Bin-Versioning': 'false' // Optional: Consider disabling versioning for index bin
    },
    body: JSON.stringify(indexData),
  });

  if (!response.ok) {
    console.error("Failed to update master index:", await response.text());
    return null;
  }

  return response.json(); // Returns the updated bin metadata
};
