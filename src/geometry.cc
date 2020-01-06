// Copyright (C) 2020 Carl Enlund
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

#include "geometry.h"

const std::vector<Vertex> kCubeVertices = {
  // Front
  {0, 1, 1, 0, 0, 1, 1, 0, 0,  0, 1},
  {1, 1, 1, 0, 0, 1, 1, 0, 0,  1, 1},
  {0, 0, 1, 0, 0, 1, 1, 0, 0,  0, 0},
  {1, 0, 1, 0, 0, 1, 1, 0, 0,  1, 0},

  // Back
  {1, 1, 0, 0, 0, -1, 1, 0, 0,  0, 1},
  {0, 1, 0, 0, 0, -1, 1, 0, 0,  1, 1},
  {1, 0, 0, 0, 0, -1, 1, 0, 0,  0, 0},
  {0, 0, 0, 0, 0, -1, 1, 0, 0,  1, 0},

  // Left
  {0, 1, 0, -1, 0, 0, 0, 1, 0,  0, 1},
  {0, 1, 1, -1, 0, 0, 0, 1, 0,  1, 1},
  {0, 0, 0, -1, 0, 0, 0, 1, 0,  0, 0},
  {0, 0, 1, -1, 0, 0, 0, 1, 0,  1, 0},

  // Right
  {1, 1, 1, 1, 0, 0, 0, 1, 0,  0, 1},
  {1, 1, 0, 1, 0, 0, 0, 1, 0,  1, 1},
  {1, 0, 1, 1, 0, 0, 0, 1, 0,  0, 0},
  {1, 0, 0, 1, 0, 0, 0, 1, 0,  1, 0},

  // Top
  {0, 1, 0, 0, 1, 0, 0, 0, 1,  0, 1},
  {1, 1, 0, 0, 1, 0, 0, 0, 1,  1, 1},
  {0, 1, 1, 0, 1, 0, 0, 0, 1,  0, 0},
  {1, 1, 1, 0, 1, 0, 0, 0, 1,  1, 0},

  // Bottom
  {0, 0, 1, 0, -1, 0, 0, 0, 1,  0, 1},
  {1, 0, 1, 0, -1, 0, 0, 0, 1,  1, 1},
  {0, 0, 0, 0, -1, 0, 0, 0, 1,  0, 0},
  {1, 0, 0, 0, -1, 0, 0, 0, 1,  1, 0},
};

const std::vector<unsigned int> kCubeIndices = {
  // Front
  2, 1, 0, 2, 3, 1,

  // Back
  6, 5, 4, 6, 7, 5,

  // Left
  10, 9, 8, 10, 11, 9,

  // Right
  14, 13, 12, 14, 15, 13,

  // Top
  18, 17, 16, 18, 19, 17,

  // Bottom
  22, 21, 20, 22, 23, 21,
};
