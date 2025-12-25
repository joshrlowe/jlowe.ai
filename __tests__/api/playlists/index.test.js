/**
 * Tests for /api/playlists/index.js
 */
import playlistsHandler from "../../../pages/api/playlists/index.js";
import prisma from "../../../lib/prisma.js";
import { createMockRequest, createMockResponse, getJsonResponse, getStatusCode } from "../setup/api-test-utils.js";

jest.mock("../../../lib/prisma.js", () => ({
  __esModule: true,
  default: {
    playlist: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("GET /api/playlists", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return all playlists", async () => {
    const mockPlaylists = [
      {
        id: "1",
        title: "Playlist 1",
        slug: "playlist-1",
      },
    ];

    prisma.playlist.findMany.mockResolvedValue(mockPlaylists);
    prisma.playlist.count.mockResolvedValue(1);

    const req = createMockRequest({ method: "GET" });
    const res = createMockResponse();

    await playlistsHandler(req, res);

    expect(prisma.playlist.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { order: "asc" },
      take: undefined,
      skip: 0,
      include: {
        playlistPosts: {
          include: {
            post: true,
          },
          orderBy: {
            order: "asc",
          },
        },
        _count: {
          select: {
            playlistPosts: true,
          },
        },
      },
    });

    expect(getStatusCode(res)).toBe(200);
    const response = getJsonResponse(res);
    expect(response.playlists).toEqual(mockPlaylists);
    expect(response.total).toBe(1);
  });

  it("should filter by featured", async () => {
    const mockPlaylists = [
      {
        id: "1",
        title: "Featured Playlist",
        featured: true,
      },
    ];

    prisma.playlist.findMany.mockResolvedValue(mockPlaylists);
    prisma.playlist.count.mockResolvedValue(1);

    const req = createMockRequest({
      method: "GET",
      query: { featured: "true" },
    });
    const res = createMockResponse();

    await playlistsHandler(req, res);

    expect(prisma.playlist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { featured: true },
      })
    );
  });

  it("should paginate results", async () => {
    prisma.playlist.findMany.mockResolvedValue([]);
    prisma.playlist.count.mockResolvedValue(0);

    const req = createMockRequest({
      method: "GET",
      query: { limit: "9", offset: "0" },
    });
    const res = createMockResponse();

    await playlistsHandler(req, res);

    expect(prisma.playlist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 9,
        skip: 0,
      })
    );
  });

  it("should sort by title", async () => {
    prisma.playlist.findMany.mockResolvedValue([]);
    prisma.playlist.count.mockResolvedValue(0);

    const req = createMockRequest({
      method: "GET",
      query: { sortBy: "title", sortOrder: "asc" },
    });
    const res = createMockResponse();

    await playlistsHandler(req, res);

    expect(prisma.playlist.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { title: "asc" },
      })
    );
  });
});

describe("POST /api/playlists", () => {
  it("should create a new playlist", async () => {
    const mockPlaylist = {
      id: "1",
      title: "New Playlist",
      slug: "new-playlist",
      description: "Description",
      featured: false,
      order: 0,
    };

    prisma.playlist.create.mockResolvedValue(mockPlaylist);

    const req = createMockRequest({
      method: "POST",
      body: {
        title: "New Playlist",
        slug: "new-playlist",
        description: "Description",
      },
    });
    const res = createMockResponse();

    await playlistsHandler(req, res);

    expect(getStatusCode(res)).toBe(201);
    const response = getJsonResponse(res);
    expect(response).toEqual(mockPlaylist);
  });

  it("should create playlist with posts", async () => {
    const mockPlaylist = {
      id: "1",
      title: "Playlist with Posts",
      slug: "playlist-posts",
      playlistPosts: [
        { postId: "post1", order: 0 },
        { postId: "post2", order: 1 },
      ],
    };

    prisma.playlist.create.mockResolvedValue(mockPlaylist);

    const req = createMockRequest({
      method: "POST",
      body: {
        title: "Playlist with Posts",
        slug: "playlist-posts",
        postIds: ["post1", "post2"],
      },
    });
    const res = createMockResponse();

    await playlistsHandler(req, res);

    expect(prisma.playlist.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          playlistPosts: {
            create: [
              { postId: "post1", order: 0 },
              { postId: "post2", order: 1 },
            ],
          },
        }),
      })
    );
  });

  it("should return 400 if required fields are missing", async () => {
    const req = createMockRequest({
      method: "POST",
      body: {
        title: "New Playlist",
        // Missing slug
      },
    });
    const res = createMockResponse();

    await playlistsHandler(req, res);

    expect(getStatusCode(res)).toBe(400);
    const response = getJsonResponse(res);
    expect(response.message).toContain("Missing required fields");
  });
});

