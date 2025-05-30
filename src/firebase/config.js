// Placeholder Firebase configuration
// This is a temporary file to fix build issues

const useMockFirebase = true;

const db = {
  collection: () => ({
    doc: () => ({
      get: () => Promise.resolve({ exists: false }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve()
    }),
    where: () => ({
      get: () => Promise.resolve({ docs: [] })
    }),
    add: () => Promise.resolve({ id: 'mock-id' })
  })
};

export { db, useMockFirebase };